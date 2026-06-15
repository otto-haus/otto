#!/usr/bin/env node
/**
 * Issue #318 — sleep/wake/background-work robustness smoke.
 *
 * Practical equivalent of Mac sleep/wake: visibility suspend + page reload + app relaunch.
 * Uses disposable app copy and isolated HOME — never writes to live default conversation
 * or official app bundles.
 *
 * Prerequisites: a built staging app template (default /Applications/otto-staging.app).
 * Override with OTTO_APP_BUNDLE if needed. Never point at /Applications/otto.app.
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-sleep-wake-smoke.cjs
 */
const { mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { homedir, tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? '/Applications/otto-staging.app';
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const SMOKE_ROOT = join(tmpdir(), `otto-staging-sleep-wake-${RUN_ID}`);
const APP_BUNDLE = join(SMOKE_ROOT, 'otto-staging-smoke.app');
const APP_BIN = join(APP_BUNDLE, 'Contents/MacOS/otto');
const CDP_BASE = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9480);
const REAL_LETTA_SETTINGS = process.env.OTTO_LETTA_SETTINGS_PATH ?? join(homedir(), '.letta', 'settings.json');

const DRAFT_KEY = 'otto.chat.draft.v1';
const QUEUE_KEY = 'otto.chat.queue.v3';
const DRAFT_MARKER = `318-smoke-draft-${RUN_ID}`;
const QUEUE_MARKER = `318-smoke-queue-${RUN_ID}`;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  refuseLiveApp(APP_TEMPLATE);

  mkdirSync(RECEIPT_DIR, { recursive: true });
  rmSync(SMOKE_ROOT, { recursive: true, force: true });
  if (!require('node:fs').existsSync(APP_TEMPLATE)) {
    throw new Error(
      `Missing app template at ${APP_TEMPLATE}. Build staging first or set OTTO_APP_BUNDLE to a disposable copy path.`,
    );
  }

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

  const proof = {
    ok: false,
    issue: 318,
    runId: RUN_ID,
    gitHead,
    appTemplate: APP_TEMPLATE,
    receiptDir: RECEIPT_DIR,
    markers: { draft: DRAFT_MARKER, queue: QUEUE_MARKER },
    phases: {},
    roster: null,
    screenshots: {},
    checks: {},
    consoleMessages: [],
  };

  const profileDir = join(SMOKE_ROOT, 'profile');
  const home = join(SMOKE_ROOT, 'home');

  // Phase 1: seed draft/queue, simulate suspend, reload (wake)
  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_BASE,
    label: 'suspendReload',
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await dismissOnboarding(page);
      await page.waitForFunction(() => typeof window.otto?.runtime?.status === 'function', null, {
        timeout: 30000,
      });

      await seedDraftAndQueue(page);
      const before = await readResumeSnapshot(page);
      proof.phases.beforeSuspend = before;

      await simulateSuspend(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissOnboarding(page);
      await page.waitForTimeout(800);

      const afterReload = await readResumeSnapshot(page);
      proof.phases.afterReload = afterReload;

      proof.checks.draftSurvivesReload = afterReload.draftText.includes(DRAFT_MARKER);
      proof.checks.queueSurvivesReload = afterReload.queueItems.some((item) => item.text.includes(QUEUE_MARKER));
      proof.checks.runtimeStatusVisible = afterReload.runtimeReady !== null;
      proof.checks.runtimeReasonWhenNotReady =
        afterReload.runtimeReady === true ||
        (typeof afterReload.runtimeReason === 'string' && afterReload.runtimeReason.length > 0);

      proof.screenshots.afterReload = join(RECEIPT_DIR, `318-sleep-wake-reload-${RUN_ID}.png`);
      await page.screenshot({ path: proof.screenshots.afterReload, fullPage: false });

      proof.roster = evaluateResumeRoster({
        draftText: afterReload.draftText,
        draftExpected: DRAFT_MARKER,
        queueItems: afterReload.queueItems,
        queueExpectedTexts: [QUEUE_MARKER],
        runtimeReady: afterReload.runtimeReady,
        runtimeReason: afterReload.runtimeReason,
        scheduledRoutines: afterReload.scheduledRoutines,
        dreamsWired: afterReload.dreamsWired,
      });
    },
  });

  // Phase 2: quit + relaunch with same profile — stronger wake/resume proxy
  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_BASE + 1,
    label: 'relaunch',
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await dismissOnboarding(page);
      await page.waitForFunction(() => typeof window.otto?.runtime?.status === 'function', null, {
        timeout: 30000,
      });

      const afterRelaunch = await readResumeSnapshot(page);
      proof.phases.afterRelaunch = afterRelaunch;

      proof.checks.draftSurvivesRelaunch = afterRelaunch.draftText.includes(DRAFT_MARKER);
      proof.checks.queueSurvivesRelaunch = afterRelaunch.queueItems.some((item) => item.text.includes(QUEUE_MARKER));
      proof.checks.runtimeStatusAfterRelaunch = afterRelaunch.runtimeReady !== null;

      proof.screenshots.afterRelaunch = join(RECEIPT_DIR, `318-sleep-wake-relaunch-${RUN_ID}.png`);
      await page.screenshot({ path: proof.screenshots.afterRelaunch, fullPage: false });
    },
  });

  proof.checks.rosterOk = proof.roster?.ok === true;
  proof.checks.namedFailures = (proof.roster?.failures ?? []).map((f) => ({
    capability: f.capability,
    state: f.state,
    nextAction: f.nextAction,
  }));

  proof.ok =
    proof.checks.draftSurvivesReload === true &&
    proof.checks.queueSurvivesReload === true &&
    proof.checks.runtimeStatusVisible === true &&
    proof.checks.runtimeReasonWhenNotReady === true &&
    proof.checks.draftSurvivesRelaunch === true &&
    proof.checks.queueSurvivesRelaunch === true &&
    proof.checks.runtimeStatusAfterRelaunch === true &&
    proof.checks.rosterOk === true;

  const outJson = join(RECEIPT_DIR, `318-sleep-wake-smoke-${RUN_ID}.json`);
  writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks, failures: proof.roster?.failures }, null, 2));
  if (!proof.ok) process.exit(1);
}

function refuseLiveApp(path) {
  if (path === '/Applications/otto.app') {
    throw new Error('Refusing live app — set OTTO_APP_BUNDLE to a disposable staging copy');
  }
  if (path.includes('/Applications/otto.app') && !path.includes('staging')) {
    throw new Error('Refusing live app path');
  }
}

function evaluateResumeRoster(snapshot) {
  const reports = [];
  const draftOk = snapshot.draftText.includes(snapshot.draftExpected);
  reports.push({
    capability: 'chat_draft',
    state: draftOk ? 'ok' : 'missing',
    detail: draftOk ? 'Draft survived.' : `Draft missing ${snapshot.draftExpected}`,
    nextAction: draftOk ? undefined : 'Check otto.chat.draft.v1 persistence on reload.',
  });

  const queueOk = snapshot.queueExpectedTexts.every((expected) =>
    snapshot.queueItems.some((item) => item.text.includes(expected)),
  );
  reports.push({
    capability: 'chat_queue',
    state: queueOk ? 'ok' : 'missing',
    detail: queueOk ? 'Queue survived.' : 'Queue item missing after resume.',
    nextAction: queueOk ? undefined : 'Inspect otto.chat.queue.v3 after suspend/resume.',
  });

  if (snapshot.runtimeReady === null) {
    reports.push({
      capability: 'runtime_socket',
      state: 'not_wired',
      detail: 'Runtime status unavailable.',
      nextAction: 'Run inside Electron with preload bridge.',
    });
  } else if (snapshot.runtimeReady) {
    reports.push({ capability: 'runtime_socket', state: 'ok', detail: 'Runtime ready after resume.' });
  } else {
    reports.push({
      capability: 'runtime_socket',
      state: 'degraded',
      detail: snapshot.runtimeReason || 'Runtime not ready.',
      nextAction: 'Retry Letta connection from Settings.',
    });
  }

  for (const routine of snapshot.scheduledRoutines.filter((r) => r.scheduled)) {
    reports.push({
      capability: `routine:${routine.slug}`,
      state: routine.allowed ? 'ok' : 'deferred',
      detail: routine.reason,
      nextAction: routine.allowed ? undefined : 'Approve routine or expect deferred execution after wake.',
    });
  }

  if (!snapshot.scheduledRoutines.some((r) => r.scheduled)) {
    reports.push({
      capability: 'scheduled_routines',
      state: 'deferred',
      detail: 'No scheduled routines in workspace.',
      nextAction: 'Expected when routines/ has no cron schedules.',
    });
  }

  reports.push({
    capability: 'dreams_background_loops',
    state: snapshot.dreamsWired ? 'deferred' : 'not_wired',
    detail: snapshot.dreamsWired ? 'Dreams wired; resume not automated.' : 'Dreams not wired in v1 shell.',
    nextAction: snapshot.dreamsWired ? 'Add explicit resume reporting.' : 'Enable when dreams ship in Labs.',
  });

  const failures = reports.filter((r) => {
    if (r.capability === 'dreams_background_loops' && r.state === 'not_wired') return false;
    return r.state === 'missing' || r.state === 'not_wired';
  });
  return { ok: failures.length === 0, reports, failures };
}

async function seedDraftAndQueue(page) {
  await page.evaluate(
    ({ draftKey, queueKey, draftMarker, queueMarker }) => {
      localStorage.setItem(draftKey, draftMarker);
      const queueItem = {
        id: `318-queue-${Date.now()}`,
        text: queueMarker,
        createdAt: Date.now(),
        state: 'queued',
        threadId: null,
      };
      localStorage.setItem(queueKey, JSON.stringify([queueItem]));
    },
    { draftKey: DRAFT_KEY, queueKey: QUEUE_KEY, draftMarker: DRAFT_MARKER, queueMarker: QUEUE_MARKER },
  );
}

async function simulateSuspend(page) {
  await page.evaluate(() => {
    try {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('blur'));
    } catch {
      /* best effort */
    }
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    try {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
    } catch {
      /* best effort */
    }
  });
  await page.waitForTimeout(200);
}

async function readResumeSnapshot(page) {
  return page.evaluate(async () => {
    const draftText = localStorage.getItem('otto.chat.draft.v1') ?? '';
    let queueItems = [];
    try {
      const parsed = JSON.parse(localStorage.getItem('otto.chat.queue.v3') ?? '[]');
      queueItems = Array.isArray(parsed) ? parsed : [];
    } catch {
      queueItems = [];
    }

    let runtimeReady = null;
    let runtimeReason = null;
    if (window.otto?.runtime?.status) {
      const status = await window.otto.runtime.status();
      runtimeReady = !!status?.ready;
      runtimeReason = status?.reason ?? null;
    }

    const scheduledRoutines = [];
    if (window.otto?.routines?.list && window.otto?.routines?.activationGate) {
      const list = await window.otto.routines.list();
      for (const routine of list.routines ?? []) {
        if (!routine.schedule?.cron && !routine.schedule?.rrule) continue;
        const gate = await window.otto.routines.activationGate(routine.slug);
        scheduledRoutines.push({
          slug: routine.slug,
          scheduled: !!gate.scheduled,
          allowed: !!gate.allowed,
          reason: gate.reason ?? '',
        });
      }
    }

    const body = document.body?.innerText ?? '';
    const dreamsWired = body.includes('Dreams') || !!document.querySelector('[data-surface="dreams"]');

    return {
      draftText,
      queueItems,
      runtimeReady,
      runtimeReason,
      scheduledRoutines,
      dreamsWired,
    };
  });
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
