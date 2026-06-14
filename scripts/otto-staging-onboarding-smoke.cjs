#!/usr/bin/env node
/**
 * Onboarding staging smoke — extends otto-032 with connected-first (069) and CTA paths (071–072).
 * Uses /Applications/otto-staging.app only — never live /Applications/otto.app.
 *
 * Requires: NODE_PATH=$HOME/.codex/admin/node_modules (playwright installed there)
 *
 * Run after: bash apps/desktop/scripts/deploy-staging.sh
 *
 *   OTTO_RECEIPT_DIR=/Users/seb/Code/otto/docs/receipts/staging \
 *     node scripts/otto-staging-onboarding-smoke.cjs
 */
const { mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { homedir, tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? '/Applications/otto-staging.app';
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const SMOKE_ROOT = join(tmpdir(), `otto-staging-onboarding-${RUN_ID}`);
const APP_BUNDLE = join(SMOKE_ROOT, 'otto-staging-smoke.app');
const APP_BIN = join(APP_BUNDLE, 'Contents/MacOS/otto');
const CDP_BASE = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9460);

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

  const proof = {
    ok: false,
    runId: RUN_ID,
    gitHead: process.env.OTTO_GIT_HEAD ?? null,
    appTemplate: APP_TEMPLATE,
    receiptDir: RECEIPT_DIR,
    screenshots: {},
    checks: {},
    consoleMessages: [],
  };

  // Phase A — connected-first welcome (069): ready before any click, Welcome still visible
  const connectedFirstProfile = join(SMOKE_ROOT, 'profile-connected-first');
  mkdirSync(connectedFirstProfile, { recursive: true });
  const lettaHome = homedir();

  await runSession({
    proof,
    profileDir: connectedFirstProfile,
    home: join(SMOKE_ROOT, 'home-connected-first'),
    port: CDP_BASE,
    envExtra: {
      HOME: lettaHome,
      OTTO_LETTA_SETTINGS_PATH: join(lettaHome, '.letta', 'settings.json'),
    },
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await waitForStatus(page, (s) => s?.ready === true, 90000);
      proof.checks.connectedFirstRuntimeReady = true;
      const welcome = page.getByRole('heading', { name: 'The behavior layer for persistent agents.' });
      const welcomeVisible = (await welcome.count()) > 0 && (await welcome.isVisible());
      proof.checks.connectedFirstWelcomeVisible = welcomeVisible;
      proof.screenshots.connectedFirst = join(RECEIPT_DIR, '069-connected-first-state.png');
      await page.screenshot({ path: proof.screenshots.connectedFirst, fullPage: false });
      if (!welcomeVisible) {
        proof.checks.connectedFirstNote =
          'Welcome not visible when runtime ready on fresh profile — Onboarding.tsx auto-sets started when ready (lines 51–54).';
      }
    },
  }).catch((error) => {
    proof.checks.connectedFirstRuntimeReady = proof.checks.connectedFirstRuntimeReady ?? false;
    proof.checks.connectedFirstWelcomeVisible = false;
    proof.checks.connectedFirstError = String(error.message ?? error);
  });

  // Phase B — secondary CTA → receipt education (072 + 071 sample)
  const receiptsCtaProfile = join(SMOKE_ROOT, 'profile-receipts-cta');
  mkdirSync(receiptsCtaProfile, { recursive: true });

  await runSession({
    proof,
    profileDir: receiptsCtaProfile,
    home: join(SMOKE_ROOT, 'home-receipts-cta'),
    port: CDP_BASE + 1,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await page.getByRole('heading', { name: 'The behavior layer for persistent agents.' }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: 'See what Receipts will prove' }).click();
      await page.getByText('Sample proof record').waitFor({ state: 'visible', timeout: 10000 });
      proof.checks.receiptsCtaShowsSample = true;
      proof.checks.receiptsCtaNotConnectDock =
        (await page.getByText('Connect otto to your local Letta').count()) === 0;
      proof.screenshots.receiptsSample = join(RECEIPT_DIR, '071-072-receipts-sample-onboarding.png');
      await page.screenshot({ path: proof.screenshots.receiptsSample, fullPage: false });
    },
  }).catch((error) => {
    proof.checks.receiptsCtaShowsSample = false;
    proof.checks.receiptsCtaError = String(error.message ?? error);
  });

  // Phase C — primary CTA "Get started →" opens connect dock (072)
  const connectCtaProfile = join(SMOKE_ROOT, 'profile-connect-cta');
  mkdirSync(connectCtaProfile, { recursive: true });

  await runSession({
    proof,
    profileDir: connectCtaProfile,
    home: join(SMOKE_ROOT, 'home-connect-cta'),
    port: CDP_BASE + 2,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await page.getByRole('heading', { name: 'The behavior layer for persistent agents.' }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: 'Get started →' }).click();
      await page.getByText('Finish connecting otto').waitFor({ timeout: 8000 });
      proof.checks.primaryCtaConnectDock = true;
      proof.screenshots.connectDock = join(RECEIPT_DIR, '072-primary-connect-dock.png');
      await page.screenshot({ path: proof.screenshots.connectDock, fullPage: false });
    },
  }).catch((error) => {
    proof.checks.primaryCtaConnectDock = false;
    proof.checks.primaryCtaError = String(error.message ?? error);
  });

  // Phase D — narrow layout dock not obscuring composer (073)
  const narrowProfile = join(SMOKE_ROOT, 'profile-narrow');
  mkdirSync(narrowProfile, { recursive: true });

  await runSession({
    proof,
    profileDir: narrowProfile,
    home: join(SMOKE_ROOT, 'home-narrow'),
    port: CDP_BASE + 3,
    viewport: { width: 880, height: 720 },
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');
      await page.getByRole('heading', { name: 'The behavior layer for persistent agents.' }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: 'Skip' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Get started →' }).click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(800);
      const composer = page.locator('textarea').first();
      await composer.waitFor({ state: 'visible', timeout: 8000 });
      const composerBox = await composer.boundingBox();
      const dock = page.locator('.onboardDock').first();
      const dockRect = (await dock.count()) ? await dock.boundingBox() : null;
      proof.checks.narrowComposerVisible = Boolean(composerBox);
      if (composerBox && dockRect) {
        proof.checks.narrowDockNotCoveringComposer =
          dockRect.y + dockRect.height <= composerBox.y || dockRect.y >= composerBox.y + composerBox.height;
      }
      proof.screenshots.narrowLayout = join(RECEIPT_DIR, '073-narrow-dock-layout.png');
      await page.screenshot({ path: proof.screenshots.narrowLayout, fullPage: false });
    },
  }).catch((error) => {
    proof.checks.narrowLayoutError = String(error.message ?? error);
  });

  proof.ok =
    proof.checks.receiptsCtaShowsSample === true &&
    proof.checks.receiptsCtaNotConnectDock === true &&
    proof.checks.primaryCtaConnectDock === true;

  const outJson = join(RECEIPT_DIR, `onboarding-smoke-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks, screenshots: proof.screenshots }, null, 2));
  if (!proof.ok) process.exit(1);
}

async function runSession({ proof, profileDir, home, port, envExtra = {}, viewport, exercise }) {
  mkdirSync(home, { recursive: true });
  const app = spawn(APP_BIN, [`--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`], {
    env: {
      ...process.env,
      HOME: home,
      OTTO_HOME: join(home, 'otto-home'),
      OTTO_SMOKE: '1',
      OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
      OTTO_SKIP_LETTA_LSOF: '1',
      ...envExtra,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let browser;
  try {
    await waitForCdp(port);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = await firstPage(browser.contexts()[0]);
    if (viewport) await page.setViewportSize(viewport);
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

async function waitForStatus(page, predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await page.evaluate(() => window.otto?.runtime?.status?.());
    if (predicate(status)) return status;
    await page.waitForTimeout(500);
  }
  throw new Error('runtime status predicate not satisfied in time');
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
