#!/usr/bin/env node
/**
 * Two-thread isolation staging smoke (046) — CDP against isolated otto-staging.app copy.
 * Creates two threads, stores distinct messages per thread, switches via sidebar, verifies
 * localStorage keys and visible chat text stay isolated.
 *
 * Never uses /Applications/otto.app.
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-two-thread-smoke.cjs
 */
const { mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? '/Applications/otto-staging.app';
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const SMOKE_ROOT = join(tmpdir(), `otto-staging-two-thread-${RUN_ID}`);
const APP_BUNDLE = join(SMOKE_ROOT, 'otto-staging-smoke.app');
const APP_BIN = join(APP_BUNDLE, 'Contents/MacOS/otto');
const CDP_BASE = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9470);

const MSG_A = `046-smoke-thread-a-${RUN_ID}`;
const MSG_B = `046-smoke-thread-b-${RUN_ID}`;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (APP_TEMPLATE.includes('/Applications/otto.app') && !APP_TEMPLATE.includes('staging')) {
    throw new Error('Refusing live app — set OTTO_APP_BUNDLE to otto-staging.app');
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

  const proof = {
    ok: false,
    runId: RUN_ID,
    gitHead,
    appTemplate: APP_TEMPLATE,
    receiptDir: RECEIPT_DIR,
    markers: { threadA: MSG_A, threadB: MSG_B },
    screenshots: {},
    checks: {},
    threads: {},
    storageKeys: {},
    consoleMessages: [],
  };

  const profileDir = join(SMOKE_ROOT, 'profile');
  const home = join(SMOKE_ROOT, 'home');

  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_BASE,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await dismissOnboarding(page);

      await page.waitForFunction(() => typeof window.otto?.threads?.list === 'function', null, {
        timeout: 30000,
      });

      const threadA = await page.evaluate(async (msgA) => {
        const list = await window.otto.threads.list();
        const activeId = list.activeThreadId;
        const thread = list.threads.find((t) => t.id === activeId) ?? list.threads[0];
        if (!thread) throw new Error('no initial thread');
        const key = `otto.chat.messages.${thread.id}.v1`;
        const payload = [{ id: 'smoke-a', who: 'user', text: msgA }];
        localStorage.setItem(key, JSON.stringify(payload));
        await window.otto.threads.touch({ title: `Thread A ${msgA.slice(-8)}` });
        return { id: thread.id, key, title: thread.title };
      }, MSG_A);

      proof.threads.a = threadA;

      await page.getByRole('button', { name: 'New chat' }).click();
      await page.waitForTimeout(600);

      const threadB = await page.evaluate(async (msgB) => {
        const list = await window.otto.threads.list();
        const activeId = list.activeThreadId;
        const thread = list.threads.find((t) => t.id === activeId);
        if (!thread) throw new Error('no thread B after New chat');
        const key = `otto.chat.messages.${thread.id}.v1`;
        const payload = [{ id: 'smoke-b', who: 'user', text: msgB }];
        localStorage.setItem(key, JSON.stringify(payload));
        await window.otto.threads.touch({ title: `Thread B ${msgB.slice(-8)}` });
        return { id: thread.id, key, title: thread.title };
      }, MSG_B);

      proof.threads.b = threadB;
      proof.checks.distinctThreadIds = threadA.id !== threadB.id;
      proof.checks.distinctStorageKeys = threadA.key !== threadB.key;

      await page.evaluate(async (threadId) => {
        await window.otto.threads.switch(threadId);
      }, threadA.id);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissOnboarding(page);
      await page.waitForTimeout(800);

      const afterSwitchA = await readActiveState(page);
      proof.checks.threadAShowsMarker = afterSwitchA.visibleText.includes(MSG_A);
      proof.checks.threadAHidesMarkerB = !afterSwitchA.visibleText.includes(MSG_B);
      proof.storageKeys.threadA = afterSwitchA.storage;

      proof.screenshots.threadA = join(RECEIPT_DIR, `046-two-thread-a-${RUN_ID}.png`);
      await page.locator('.chat').first().screenshot({ path: proof.screenshots.threadA }).catch(async () => {
        await page.screenshot({ path: proof.screenshots.threadA, fullPage: false });
      });

      await page.evaluate(async (threadId) => {
        await window.otto.threads.switch(threadId);
      }, threadB.id);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissOnboarding(page);
      await page.waitForTimeout(800);

      const afterSwitchB = await readActiveState(page);
      proof.checks.threadBShowsMarker = afterSwitchB.visibleText.includes(MSG_B);
      proof.checks.threadBHidesMarkerA = !afterSwitchB.visibleText.includes(MSG_A);
      proof.storageKeys.threadB = afterSwitchB.storage;

      proof.screenshots.threadB = join(RECEIPT_DIR, `046-two-thread-b-${RUN_ID}.png`);
      await page.locator('.chat').first().screenshot({ path: proof.screenshots.threadB }).catch(async () => {
        await page.screenshot({ path: proof.screenshots.threadB, fullPage: false });
      });

      proof.checks.sidebarThreadCount = await page.locator('.sidebar__threads .thread').count();

      const composer = page.locator('textarea[aria-label="Message Otto"]');
      if (await composer.isEnabled().catch(() => false)) {
        await composer.fill(`046-ui-send-${RUN_ID}`);
        await page.getByRole('button', { name: 'Send message' }).click();
        await page.waitForTimeout(500);
        proof.checks.uiSendAttempted = true;
      } else {
        proof.checks.uiSendAttempted = false;
        proof.checks.uiSendSkippedReason = 'composer disabled (runtime not ready)';
      }

      return { threadA, threadB };
    },
  });

  // Session 2: quit + relaunch with same profile — proves thread index survives app restart (046 Done-when)
  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_BASE + 1,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await dismissOnboarding(page);
      await page.waitForFunction(() => typeof window.otto?.threads?.list === 'function', null, {
        timeout: 30000,
      });

      const list = await page.evaluate(async () => {
        const r = await window.otto.threads.list();
        return {
          activeThreadId: r.activeThreadId,
          threads: r.threads.map((t) => ({ id: t.id, title: t.title })),
        };
      });

      proof.checks.relaunchThreadCount = list.threads.length;
      proof.checks.relaunchHasThreadA = list.threads.some((t) => t.id === proof.threads.a?.id);
      proof.checks.relaunchHasThreadB = list.threads.some((t) => t.id === proof.threads.b?.id);

      await page.evaluate(async (threadId) => {
        await window.otto.threads.switch(threadId);
      }, proof.threads.a.id);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissOnboarding(page);
      await page.waitForTimeout(800);

      const afterQuitA = await readActiveState(page);
      proof.checks.relaunchThreadAShowsMarker = afterQuitA.visibleText.includes(MSG_A);
      proof.checks.relaunchThreadAHidesMarkerB = !afterQuitA.visibleText.includes(MSG_B);
      proof.storageKeys.afterQuitA = afterQuitA.storage;

      proof.screenshots.afterQuit = join(RECEIPT_DIR, `046-after-quit-${RUN_ID}.png`);
      await page.locator('.sidebar').first().screenshot({ path: proof.screenshots.afterQuit }).catch(async () => {
        await page.screenshot({ path: proof.screenshots.afterQuit, fullPage: false });
      });
    },
  });

  proof.checks.relaunchOk =
    proof.checks.relaunchHasThreadA === true &&
    proof.checks.relaunchHasThreadB === true &&
    proof.checks.relaunchThreadAShowsMarker === true &&
    proof.checks.relaunchThreadAHidesMarkerB === true &&
    (proof.checks.relaunchThreadCount ?? 0) >= 2;

  proof.ok =
    proof.checks.distinctThreadIds === true &&
    proof.checks.distinctStorageKeys === true &&
    proof.checks.threadAShowsMarker === true &&
    proof.checks.threadAHidesMarkerB === true &&
    proof.checks.threadBShowsMarker === true &&
    proof.checks.threadBHidesMarkerA === true &&
    (proof.checks.sidebarThreadCount ?? 0) >= 2 &&
    proof.checks.relaunchOk === true;

  const outJson = join(RECEIPT_DIR, `two-thread-smoke-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks, threads: proof.threads }, null, 2));
  if (!proof.ok) process.exit(1);
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
    const done = page.getByRole('button', { name: /^Done$/ });
    if ((await done.count()) > 0) {
      await done.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    if ((await overlay.count()) > 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
    }
  }
  await overlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

async function readActiveState(page) {
  return page.evaluate(async () => {
    const list = await window.otto.threads.list();
    const activeId = list.activeThreadId;
    const key = activeId ? `otto.chat.messages.${activeId}.v1` : 'otto.chat.messages.v1';
    const raw = localStorage.getItem(key);
    let parsed = [];
    try {
      parsed = JSON.parse(raw ?? '[]');
    } catch {
      parsed = [];
    }
    const chat = document.querySelector('.chat');
    return {
      activeThreadId: activeId,
      key,
      rawLength: raw?.length ?? 0,
      messageCount: Array.isArray(parsed) ? parsed.length : 0,
      storage: { key, sample: Array.isArray(parsed) ? parsed.slice(0, 3) : [] },
      visibleText: chat?.textContent ?? document.body.innerText,
    };
  });
}

async function runSession({ proof, profileDir, home, port, exercise }) {
  mkdirSync(home, { recursive: true });
  const app = spawn(APP_BIN, [`--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`], {
    env: {
      ...process.env,
      HOME: home,
      OTTO_HOME: join(home, 'otto-home'),
      OTTO_SMOKE: '1',
      OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
      OTTO_SKIP_LETTA_LSOF: '1',
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
