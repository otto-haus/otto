#!/usr/bin/env node
/**
 * Issue #314 — staging release-candidate smoke.
 *
 *   OTTO_STAGING_APP=/Applications/otto-314-rc.app \
 *   OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-314-rc \
 *   OTTO_STAGING_PORT=9450 \
 *   bash apps/desktop/scripts/deploy-staging.sh
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-release-candidate-smoke.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_BASE = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const RECEIPT_DIR = join(RECEIPT_BASE, `314-staging-release-candidate-${RUN_ID}`);
const TIMEOUT_MS = Number(process.env.OTTO_314_SMOKE_TIMEOUT_MS ?? 90000);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!STAGING_APP.includes('staging') && !STAGING_APP.includes('314-rc')) {
    throw new Error(`Refusing non-disposable staging app path: ${STAGING_APP}`);
  }
  if (STAGING_APP === '/Applications/otto.app') {
    throw new Error('Refusing live app path');
  }

  let gitHead = process.env.OTTO_GIT_HEAD;
  if (!gitHead) {
    try {
      gitHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      gitHead = null;
    }
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  const proof = {
    ok: false,
    issue: 314,
    runId: RUN_ID,
    gitHead,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    receiptDir: RECEIPT_DIR,
    checks: {},
    buildInfo: null,
    runtimeStatus: null,
    screenshots: {},
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const initial = await readChatState(page);
    proof.runtimeStatus = initial.status;
    proof.buildInfo = initial.buildInfo;
    proof.checks.nonBlankUi = initial.bodyLen > 120;
    proof.checks.bootShellGone = initial.bootShellGone;
    proof.checks.commandStationAbsent = initial.commandStationAbsent;
    proof.checks.explicitReadinessWhenNotReady =
      initial.status?.ready === true ||
      (initial.setupVisible && initial.setupHasRetry);
    proof.checks.buildMarkerPresent = !!initial.buildInfo?.shortSha;
    proof.checks.buildMarkerMatchesGit =
      !gitHead || !initial.buildInfo?.shortSha || initial.buildInfo.shortSha.startsWith(gitHead);

    proof.screenshots.chat = join(RECEIPT_DIR, 'chat-default.png');
    await page.screenshot({ path: proof.screenshots.chat, fullPage: false });

    await openSettings(page);
    await page.waitForTimeout(400);
    const settingsMarker = await page.locator('[data-testid="otto-build-marker"]').innerText().catch(() => '');
    proof.checks.settingsBuildMarkerVisible = settingsMarker.includes(initial.buildInfo?.shortSha ?? '___none___');
    proof.screenshots.settings = join(RECEIPT_DIR, 'settings-build-marker.png');
    await page.screenshot({ path: proof.screenshots.settings, fullPage: false });

    proof.ok = Object.values(proof.checks).every(Boolean);
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

async function readChatState(page) {
  return page.evaluate(async () => {
    const body = document.body?.innerText ?? '';
    const status = window.otto?.runtime?.status ? await window.otto.runtime.status() : null;
    const buildInfo = window.otto?.app?.buildInfo ? await window.otto.app.buildInfo() : null;
    return {
      bodyLen: body.length,
      bootShellGone: !document.getElementById('otto-boot-shell'),
      commandStationAbsent:
        !document.querySelector('.commandStation') &&
        !body.includes('COMMAND STATION') &&
        !body.includes('What needs you'),
      setupVisible: !!document.querySelector('.chat__setup'),
      setupHasRetry: body.includes('Retry') && body.includes('Open Settings'),
      status,
      buildInfo,
    };
  });
}

async function openSettings(page) {
  await page.evaluate(() => {
    location.hash = 'settings';
  });
  await page.waitForFunction(() => location.hash.includes('settings'), null, { timeout: TIMEOUT_MS });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
