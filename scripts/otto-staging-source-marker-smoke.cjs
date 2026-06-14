#!/usr/bin/env node
/**
 * Issues #321 / #338 — staging source marker smoke.
 *
 *   task staging
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-staging-source-marker-smoke.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_BASE = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const RECEIPT_DIR = join(RECEIPT_BASE, `321-338-source-marker-${RUN_ID}`);
const TIMEOUT_MS = Number(process.env.OTTO_SOURCE_MARKER_SMOKE_TIMEOUT_MS ?? 90000);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (STAGING_APP === '/Applications/otto.app') {
    throw new Error('Refusing live app path');
  }

  let originMainShort = process.env.OTTO_ORIGIN_MAIN_SHORT ?? null;
  if (!originMainShort) {
    try {
      execFileSync('git', ['fetch', 'origin', 'main'], { stdio: 'ignore' });
      originMainShort = execFileSync('git', ['rev-parse', '--short', 'origin/main'], { encoding: 'utf8' }).trim();
    } catch {
      originMainShort = null;
    }
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  const proof = {
    ok: false,
    issues: [321, 338],
    runId: RUN_ID,
    originMainShort,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    receiptDir: RECEIPT_DIR,
    checks: {},
    buildInfo: null,
    markerText: null,
    screenshots: {},
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);

    const snapshot = await page.evaluate(async () => {
      const buildInfo = window.otto?.app?.buildInfo ? await window.otto.app.buildInfo() : null;
      const marker = document.querySelector('[data-testid="otto-source-marker"]');
      return {
        buildInfo,
        markerText: marker?.textContent?.trim() ?? null,
      };
    });

    proof.buildInfo = snapshot.buildInfo;
    proof.markerText = snapshot.markerText;
    proof.checks.markerVisible = !!snapshot.markerText;
    proof.checks.channelPresent = snapshot.buildInfo?.channel === 'staging';
    proof.checks.shortShaPresent = !!snapshot.buildInfo?.shortSha;
    proof.checks.versionPresent = !!snapshot.buildInfo?.version;
    proof.checks.appPathPresent = !!snapshot.buildInfo?.appPath;
    proof.checks.profilePathPresent = !!snapshot.buildInfo?.profilePath;
    proof.checks.mainShaPresent = !!snapshot.buildInfo?.mainSha;
    proof.checks.matchesMainWhenExpected =
      originMainShort == null ||
      snapshot.buildInfo?.matchesMain === true ||
      snapshot.buildInfo?.matchesMain === false;
    proof.checks.markerWarnsWhenBehind =
      snapshot.buildInfo?.matchesMain !== false ||
      (snapshot.markerText ?? '').includes('behind main') ||
      (snapshot.markerText ?? '').includes('not latest main');

    proof.screenshots.chat = join(RECEIPT_DIR, 'chat-source-marker.png');
    await page.screenshot({ path: proof.screenshots.chat, fullPage: false });

    await page.evaluate(() => { location.hash = 'settings'; });
    await page.waitForFunction(() => location.hash.includes('settings'), null, { timeout: TIMEOUT_MS });
    await page.waitForTimeout(400);
    proof.screenshots.settings = join(RECEIPT_DIR, 'settings-source-details.png');
    await page.screenshot({ path: proof.screenshots.settings, fullPage: false });
    proof.checks.settingsDetailsVisible = await page.locator('[data-testid="otto-source-details"]').count() > 0;

    const missing = [];
    if (!proof.checks.channelPresent) missing.push('channel');
    if (!proof.checks.shortShaPresent) missing.push('shortSha');
    if (!proof.checks.markerVisible) missing.push('visible marker');
    proof.checks.sourceMarkerComplete = missing.length === 0;
    if (missing.length) {
      proof.markerWarning = `Missing source marker fields: ${missing.join(', ')}`;
    }

    proof.ok = Object.entries(proof.checks)
      .filter(([key]) => key !== 'matchesMainWhenExpected')
      .every(([, value]) => value === true);

    writeFileSync(join(RECEIPT_DIR, 'proof.json'), `${JSON.stringify(proof, null, 2)}\n`);
    console.log(JSON.stringify(proof, null, 2));
    if (!proof.ok) process.exit(1);
  } finally {
    await browser.close();
  }
}

async function waitForCdp(port, timeoutMs = TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`CDP not ready on port ${port}`);
}

async function firstPage(context) {
  for (const page of context.pages()) {
    if (!page.url().startsWith('devtools://')) return page;
  }
  return context.waitForEvent('page', { timeout: TIMEOUT_MS });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
