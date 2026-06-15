#!/usr/bin/env node
/**
 * Long-conversation + attachment performance smoke (323) — CDP against disposable otto-staging copy.
 * Seeds many messages, activity cards, queue states, and an attachment; measures hydrate/scroll/action latency.
 *
 * Never uses /Applications/otto.app. Does not mutate the staging template bundle.
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-staging-long-conversation-perf-smoke.cjs
 */
const { mkdirSync, rmSync, writeFileSync, existsSync } = require('node:fs');
const { homedir, tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? '/Applications/otto-staging.app';
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const SMOKE_ROOT = join(tmpdir(), `otto-staging-long-conv-${RUN_ID}`);
const APP_BUNDLE = join(SMOKE_ROOT, 'otto-staging-smoke.app');
const APP_BIN = join(APP_BUNDLE, 'Contents/MacOS/otto');
const CDP_PORT = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9480);
const REAL_LETTA_SETTINGS = process.env.OTTO_LETTA_SETTINGS_PATH ?? join(homedir(), '.letta', 'settings.json');

/** Keep in sync with apps/desktop/src/chat/long-conversation-smoke-fixture.ts */
const THRESHOLDS = {
  hydrateMs: 8000,
  scrollTailMs: 600,
  actionProbeMs: 1200,
  minMsgRows: 30,
  minReceiptCards: 5,
  minMessageActions: 3,
};

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (APP_TEMPLATE.includes('/Applications/otto.app') && !APP_TEMPLATE.includes('staging')) {
    throw new Error('Refusing live app — set OTTO_APP_BUNDLE to otto-staging.app');
  }
  if (!existsSync(APP_TEMPLATE)) {
    throw new Error(`Staging app missing at ${APP_TEMPLATE} — run bash apps/desktop/scripts/deploy-staging.sh`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  rmSync(SMOKE_ROOT, { recursive: true, force: true });
  execFileSync('/usr/bin/ditto', [APP_TEMPLATE, APP_BUNDLE]);
  const safeRunId = RUN_ID.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  execFileSync('/usr/libexec/PlistBuddy', [
    '-c',
    `Set :CFBundleIdentifier haus.otto.desktop.staging-smoke.${safeRunId}`,
    '-c',
    `Set :CFBundleDisplayName otto staging smoke ${RUN_ID}`,
    '-c',
    'Set :CFBundleName otto',
    join(APP_BUNDLE, 'Contents/Info.plist'),
  ]);
  execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', APP_BUNDLE]);

  let gitHead = process.env.OTTO_GIT_HEAD;
  if (!gitHead) {
    try {
      gitHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      gitHead = null;
    }
  }

  const fixture = buildFixture(RUN_ID);
  const proof = {
    ok: false,
    issue: 323,
    runId: RUN_ID,
    gitHead,
    appTemplate: APP_TEMPLATE,
    receiptDir: RECEIPT_DIR,
    marker: fixture.marker,
    thresholds: THRESHOLDS,
    metrics: {},
    evaluation: null,
    screenshots: {},
    checks: {},
    consoleMessages: [],
  };

  const profileDir = join(SMOKE_ROOT, 'profile');
  const home = join(SMOKE_ROOT, 'home');

  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_PORT,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await dismissOnboarding(page);
      await page.waitForFunction(() => typeof window.otto?.threads?.list === 'function', null, {
        timeout: 30000,
      });

      const thread = await page.evaluate(async () => {
        const list = await window.otto.threads.list();
        const activeId = list.activeThreadId;
        const threadRow = list.threads.find((t) => t.id === activeId) ?? list.threads[0];
        if (!threadRow) throw new Error('no active thread');
        return { id: threadRow.id, key: `otto.chat.messages.${threadRow.id}.v1` };
      });

      await page.evaluate(({ seed, threadId }) => {
        localStorage.setItem(seed.messagesKey, JSON.stringify(seed.messages));
        localStorage.setItem('otto.chat.queue.v3', JSON.stringify(seed.queue));
        localStorage.setItem('otto.chat.attachments.v1', JSON.stringify(seed.attachments));
        localStorage.setItem('otto.chat.draft.v1', seed.marker);
        if (threadId) localStorage.setItem('otto.chat.activeThreadId.v1', threadId);
      }, {
        seed: {
          messagesKey: thread.key,
          messages: fixture.messages,
          queue: fixture.queue,
          attachments: fixture.attachments,
          marker: fixture.marker,
        },
        threadId: thread.id,
      });

      const hydrateStart = Date.now();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissOnboarding(page);
      await waitForStatus(page, (s) => s?.ready === true, 90000);
      await page.waitForFunction(
        (minRows) => document.querySelectorAll('.msgRow').length >= minRows,
        THRESHOLDS.minMsgRows,
        { timeout: THRESHOLDS.hydrateMs },
      );
      const hydrateMs = Date.now() - hydrateStart;

      const scrollStart = Date.now();
      await page.evaluate(() => {
        const stream = document.querySelector('.chat__stream');
        if (!stream) throw new Error('missing .chat__stream');
        stream.scrollTop = stream.scrollHeight;
      });
      await page.waitForFunction(() => {
        const stream = document.querySelector('.chat__stream');
        if (!stream) return false;
        return stream.scrollTop + stream.clientHeight >= stream.scrollHeight - 4;
      }, null, { timeout: THRESHOLDS.scrollTailMs });
      const scrollTailMs = Date.now() - scrollStart;

      const actionStart = Date.now();
      const actionButton = page.locator('.msgActions__btn').first();
      const actionCount = await page.locator('.msgActions__btn').count();
      if (actionCount > 0) {
        await actionButton.click({ timeout: THRESHOLDS.actionProbeMs });
        await page.locator('.modal, [role="dialog"]').first().waitFor({ state: 'visible', timeout: THRESHOLDS.actionProbeMs }).catch(() => {});
      }
      const actionProbeMs = Date.now() - actionStart;

      const domCounts = await page.evaluate((marker) => ({
        msgRowCount: document.querySelectorAll('.msgRow').length,
        receiptCardCount: document.querySelectorAll('.receiptInline').length,
        messageActionCount: document.querySelectorAll('.msgActions__btn').length,
        queueVisible: !!document.querySelector('.queuebar'),
        attachmentTrayVisible: !!document.querySelector('.attachmentTray'),
        markerVisible: (document.querySelector('.chat')?.textContent ?? '').includes(marker),
        readyDot: !!document.querySelector('.dot--ok'),
      }), fixture.marker);

      const status = await page.evaluate(async () => {
        const api = window.otto?.runtime?.status;
        if (typeof api !== 'function') return null;
        try {
          return await api();
        } catch {
          return null;
        }
      });

      proof.metrics = {
        hydrateMs,
        scrollTailMs,
        actionProbeMs,
        msgRowCount: domCounts.msgRowCount,
        receiptCardCount: domCounts.receiptCardCount,
        messageActionCount: domCounts.messageActionCount,
        queueVisible: domCounts.queueVisible,
        attachmentTrayVisible: domCounts.attachmentTrayVisible,
        ready: status?.ready === true || domCounts.readyDot,
        markerVisible: domCounts.markerVisible,
        seededMessageCount: fixture.messages.length,
      };

      proof.evaluation = evaluateMetrics(proof.metrics);
      proof.checks = {
        markerVisible: domCounts.markerVisible,
        evaluationOk: proof.evaluation.ok,
        bottleneck: proof.evaluation.bottleneck,
      };

      proof.screenshots.longConversation = join(RECEIPT_DIR, `323-long-conv-${RUN_ID}.png`);
      await page.locator('.chat').first().screenshot({ path: proof.screenshots.longConversation }).catch(async () => {
        await page.screenshot({ path: proof.screenshots.longConversation, fullPage: false });
      });
    },
  });

  proof.ok = proof.evaluation?.ok === true;

  const outJson = join(RECEIPT_DIR, `323-long-conversation-perf-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');

  const summary = {
    ok: proof.ok,
    outJson,
    bottleneck: proof.evaluation?.bottleneck ?? null,
    failures: proof.evaluation?.failures ?? [],
    metrics: proof.metrics,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!proof.ok) process.exit(1);
}

function buildFixture(runId) {
  const marker = `323-long-conv-smoke-${runId}`;
  const messages = [];
  for (let i = 0; i < 96; i += 1) {
    const isUser = i % 3 === 0;
    const isError = i % 17 === 0;
    const who = isError ? 'error' : isUser ? 'user' : 'otto';
    const msg = {
      id: `323-msg-${i}-${runId}`,
      who,
      text: isUser
        ? `Operator turn ${i}: ${marker} — paste-friendly copy block with inline code and a short plan.`
        : isError
          ? `Runtime hiccup on turn ${i}. ${marker}`
          : `otto turn ${i}: ${marker}\n\n- tool output summary\n- follow-up question`,
    };
    if (!isUser && !isError && i % 4 === 1) {
      msg.receiptInline = {
        id: `rcpt-${i}-${runId}`,
        status: i % 8 === 1 ? 'blocked' : 'success',
        action: `tool.run.${i % 5}`,
        summary: `Activity card ${i} for ${marker}`,
        authority: 'human (permission gate)',
      };
    }
    if (!isUser && !isError && i % 11 === 2) {
      msg.checkBlock = {
        checkName: `check-${i}`,
        message: `Check block ${i} blocked downstream work.`,
        receiptId: `rcpt-block-${i}`,
        standardId: `std-${i % 3}`,
      };
    }
    messages.push(msg);
  }

  const now = Date.now();
  return {
    marker,
    messages,
    queue: [
      {
        id: `323-queue-queued-${runId}`,
        text: `Follow-up after long thread review (${marker}).`,
        createdAt: now - 5000,
        state: 'queued',
      },
      {
        id: `323-queue-failed-${runId}`,
        text: `Failed steer while runtime was busy (${marker}).`,
        createdAt: now - 3000,
        state: 'failed',
      },
    ],
    attachments: [
      {
        id: `323-attach-${runId}`,
        name: `perf-smoke-${runId}.png`,
        mime: 'image/png',
        path: `/tmp/otto-smoke/${runId}.png`,
        url: TINY_PNG,
        size: 68,
      },
    ],
  };
}

function evaluateMetrics(metrics) {
  const failures = [];
  let bottleneck = null;
  const fail = (reason, likely) => {
    failures.push(reason);
    if (!bottleneck) bottleneck = likely;
  };

  if (metrics.hydrateMs > THRESHOLDS.hydrateMs) {
    fail(`hydrateMs ${metrics.hydrateMs} > ${THRESHOLDS.hydrateMs}`, 'initial render / message hydration');
  }
  if (metrics.scrollTailMs > THRESHOLDS.scrollTailMs) {
    fail(`scrollTailMs ${metrics.scrollTailMs} > ${THRESHOLDS.scrollTailMs}`, 'scroll layout / stream height');
  }
  if (metrics.actionProbeMs > THRESHOLDS.actionProbeMs) {
    fail(`actionProbeMs ${metrics.actionProbeMs} > ${THRESHOLDS.actionProbeMs}`, 'interaction handlers / message actions');
  }
  if (metrics.msgRowCount < THRESHOLDS.minMsgRows) {
    fail(`msgRowCount ${metrics.msgRowCount} < ${THRESHOLDS.minMsgRows}`, 'message parsing / DOM render');
  }
  if (metrics.receiptCardCount < THRESHOLDS.minReceiptCards) {
    fail(`receiptCardCount ${metrics.receiptCardCount} < ${THRESHOLDS.minReceiptCards}`, 'activity card render');
  }
  if (metrics.messageActionCount < THRESHOLDS.minMessageActions) {
    fail(`messageActionCount ${metrics.messageActionCount} < ${THRESHOLDS.minMessageActions}`, 'message action affordances');
  }
  if (!metrics.ready) {
    fail('ready=false (queue + attachment affordances require runtime ready)', 'runtime readiness / Letta connection');
  } else {
    if (!metrics.queueVisible) fail('queueVisible=false', 'queue strip render');
    if (!metrics.attachmentTrayVisible) fail('attachmentTrayVisible=false', 'attachment tray render');
  }
  if (!metrics.markerVisible) {
    fail('markerVisible=false', 'seeded conversation not rendered');
  }

  return { ok: failures.length === 0, failures, bottleneck };
}

async function dismissOnboarding(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('otto.onboarded.v1', '1');
    } catch {
      /* ignore */
    }
  });
  const overlay = page.locator('.onboardOverlay');
  if ((await overlay.count()) > 0) {
    const skip = page.getByRole('button', { name: /^Skip/ });
    if ((await skip.count()) > 0) {
      await skip.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  await overlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

async function waitForStatus(page, predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await page.evaluate(async () => {
      const api = window.otto?.runtime?.status;
      if (typeof api !== 'function') return null;
      try {
        return await api();
      } catch {
        return null;
      }
    });
    if (predicate(status)) return status;
    await page.waitForTimeout(250);
  }
  return null;
}

async function runSession({ proof, profileDir, home, port, exercise }) {
  mkdirSync(home, { recursive: true });
  const lettaBaseUrl = process.env.LETTA_BASE_URL ?? discoverLettaBaseUrl();
  const app = spawn(APP_BIN, [`--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`], {
    env: {
      ...process.env,
      HOME: home,
      OTTO_HOME: join(home, 'otto-home'),
      OTTO_SMOKE: '1',
      OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
      OTTO_SKIP_LETTA_LSOF: '1',
      ...(REAL_LETTA_SETTINGS ? { OTTO_LETTA_SETTINGS_PATH: REAL_LETTA_SETTINGS } : {}),
      ...(lettaBaseUrl ? { LETTA_BASE_URL: lettaBaseUrl } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let browser;
  try {
    await waitForCdp(port);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = await firstPage(browser.contexts()[0]);
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        proof.consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    await exercise(page);
  } finally {
    if (browser) await browser.close().catch(() => {});
    app.kill('SIGTERM');
    await new Promise((r) => app.once('exit', r));
  }
}

function discoverLettaBaseUrl() {
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], {
      timeout: 3000,
      encoding: 'utf8',
    });
    const line = out.split('\n').find((row) => /letta/i.test(row) && /(?:127\.0\.0\.1|localhost):\d+/i.test(row));
    const match = line?.match(/(?:127\.0\.0\.1|localhost):(\d+)/i);
    return match ? `http://127.0.0.1:${match[1]}` : null;
  } catch {
    return null;
  }
}

async function waitForCdp(port, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`CDP not ready on port ${port}`);
}

async function firstPage(context) {
  for (let i = 0; i < 40; i += 1) {
    const pages = context.pages();
    if (pages.length) return pages[0];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('No CDP page found');
}
