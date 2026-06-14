#!/usr/bin/env node
/**
 * Staging UI proof capture via CDP against running otto-staging.app (port 9445).
 * Never connects to /Applications/otto.app.
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   OTTO_GIT_HEAD=$(git rev-parse --short HEAD) node scripts/otto-staging-proof-capture.cjs
 */
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!STAGING_APP.includes('staging')) {
    throw new Error(`Refusing non-staging app path: ${STAGING_APP}`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });

  let gitHead = process.env.OTTO_GIT_HEAD;
  if (!gitHead) {
    try {
      gitHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      gitHead = 'unknown';
    }
  }

  const proof = {
    ok: false,
    runId: RUN_ID,
    gitHead,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    home: process.env.OTTO_STAGING_ROOT ? `${process.env.OTTO_STAGING_ROOT}/home` : `${process.env.HOME}/.codex/admin/otto-staging/home`,
    screenshots: {},
    checks: {},
    runtimeStatus: null,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.waitForLoadState('domcontentloaded');

    proof.runtimeStatus = await page.evaluate(() => window.otto?.runtime?.status?.() ?? null);
    proof.checks.runtimeReady = proof.runtimeStatus?.ready === true;
    proof.checks.transportMode = proof.runtimeStatus?.transport ?? proof.runtimeStatus?.mode ?? null;

    // 127 — Command Station culture cards on Chat home
    const cultureSection = page.locator('.commandStation');
    await cultureSection.waitFor({ timeout: 15000 });
    proof.checks.commandStationVisible = true;
    proof.checks.constitutionCard = (await page.getByText('Constitution', { exact: false }).count()) > 0;
    proof.checks.changelogCard = (await page.getByText('Changelog', { exact: false }).count()) > 0;
    proof.screenshots.commandStation = join(RECEIPT_DIR, '127-command-station-culture-home.png');
    await cultureSection.screenshot({ path: proof.screenshots.commandStation });

    // 046 — thread list in sidebar
    const threadList = page.locator('.sidebar__threads');
    proof.checks.threadListRendered = (await threadList.count()) > 0;
    proof.screenshots.sidebarThreads = join(RECEIPT_DIR, '046-sidebar-thread-list.png');
    await page.locator('.sidebar').first().screenshot({ path: proof.screenshots.sidebarThreads });

    // 050 — precedent conflict on candor-kindness standard
    await page.getByRole('button', { name: 'Standards' }).click();
    await page.getByText('The test:').first().waitFor({ timeout: 10000 });
    proof.checks.standardsTestLine = true;
    const candorRow = page.getByText(/candor|candor-kindness/i).first();
    if ((await candorRow.count()) > 0) {
      await candorRow.click();
      await page.waitForTimeout(800);
      const conflictBanner = page.getByText('conflict · case law');
      proof.checks.precedentConflictBanner = (await conflictBanner.count()) > 0;
      if (proof.checks.precedentConflictBanner) {
        proof.screenshots.precedentConflict = join(RECEIPT_DIR, '050-precedent-conflict-banner.png');
        await page.screenshot({ path: proof.screenshots.precedentConflict, fullPage: false });
      }
    }
    proof.screenshots.standardsFooter = join(RECEIPT_DIR, '067-standards-test-footer.png');
    await page.screenshot({ path: proof.screenshots.standardsFooter, fullPage: false });

    // Remove duplicate standards navigation below
    // 047 — Memory observatory in Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: /Memory observatory/i }).click();
    await page.waitForTimeout(1500);
    proof.checks.memoryObservatorySection = (await page.getByText(/Memory observatory|memory block/i).count()) > 0;
    proof.checks.memoryBlockRows = await page.locator('.panel .h-sec').filter({ hasText: /system\/|human|persona/i }).count();
    proof.screenshots.memoryObservatory = join(RECEIPT_DIR, '047-memory-observatory.png');
    await page.screenshot({ path: proof.screenshots.memoryObservatory, fullPage: false });

    // Settings footer for 067
    await page.getByRole('button', { name: 'General' }).click();
    proof.checks.settingsTestLine = (await page.getByText('The test:').count()) > 0;
    proof.screenshots.settingsFooter = join(RECEIPT_DIR, '067-settings-test-footer.png');
    await page.screenshot({ path: proof.screenshots.settingsFooter, fullPage: false });

    // 039 — transport line in Settings (General or providers)
    const transportLine = page.getByText(/transport:/i);
    proof.checks.settingsTransportLine = (await transportLine.count()) > 0;

    proof.ok =
      proof.checks.commandStationVisible &&
      proof.checks.constitutionCard &&
      proof.checks.changelogCard &&
      proof.checks.standardsTestLine;
  } finally {
    await browser.close().catch(() => {});
  }

  // 065 — static site local check (no Electron)
  try {
    const siteIndex = join(process.cwd(), 'site/index.html');
    const html = readFileSync(siteIndex, 'utf8');
    proof.checks.siteIndexExists = html.includes('Letta remembers');
    proof.checks.siteResponsiveMeta = html.includes('viewport');
  } catch {
    proof.checks.siteIndexExists = false;
  }

  const outJson = join(RECEIPT_DIR, `staging-proof-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks }, null, 2));
}

async function waitForCdp(port, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`CDP not ready on port ${port} — run deploy-staging.sh first`);
}

async function firstPage(context) {
  for (let i = 0; i < 40; i += 1) {
    const pages = context.pages();
    if (pages.length) return pages[0];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('No CDP page found');
}
