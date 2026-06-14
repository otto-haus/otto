#!/usr/bin/env node
/**
 * Ticket proof capture — 081 Chat polish + 135 Culture CI surfaces (staging only).
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-staging-ticket-proof-capture.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const VIEWPORT = { width: 1280, height: 720 };

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!STAGING_APP.includes('staging')) {
    throw new Error(`Refusing non-staging app path: ${STAGING_APP}`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  mkdirSync(join(RECEIPT_DIR, '135-culture-ci-demo'), { recursive: true });

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
    viewport: VIEWPORT,
    screenshots: {},
    checks: {},
    runtimeStatus: null,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const context = browser.contexts()[0];
    const page = await firstPage(context);
    await page.setViewportSize(VIEWPORT);
    await page.waitForLoadState('domcontentloaded');

    proof.runtimeStatus = await page.evaluate(() => window.otto?.runtime?.status?.() ?? null);
    proof.checks.runtimeReady = proof.runtimeStatus?.ready === true;

    // 081 — Chat shell at 1280px (no dev cli:/MemFS strings in default view)
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(800);
    const bodyText = await page.locator('body').innerText();
    proof.checks.noCliString = !/\bcli:\s/i.test(bodyText);
    proof.checks.noMemFsString = !/MemFS on/i.test(bodyText);
    proof.screenshots.chat081 = join(RECEIPT_DIR, '081-chat-shell-polish.png');
    await page.screenshot({ path: proof.screenshots.chat081, fullPage: false });

    // 135 — Checks surface (Culture CI product noun)
    await page.getByRole('button', { name: 'Checks' }).click();
    await page.waitForTimeout(800);
    proof.checks.checksSurfaceVisible = (await page.getByText(/Checks|check/i).count()) > 0;
    proof.screenshots.checks135 = join(RECEIPT_DIR, '135-culture-ci-demo', '01-checks-surface.png');
    await page.screenshot({ path: proof.screenshots.checks135, fullPage: false });

    // 135 — Curation (proposal path)
    await page.getByRole('button', { name: 'Curation' }).click();
    await page.waitForTimeout(800);
    proof.screenshots.curation135 = join(RECEIPT_DIR, '135-culture-ci-demo', '02-curation-surface.png');
    await page.screenshot({ path: proof.screenshots.curation135, fullPage: false });

    // 135 — Standards (compile source)
    await page.getByRole('button', { name: 'Standards' }).click();
    await page.waitForTimeout(800);
    proof.screenshots.standards135 = join(RECEIPT_DIR, '135-culture-ci-demo', '03-standards-surface.png');
    await page.screenshot({ path: proof.screenshots.standards135, fullPage: false });

    // 135 — block banner if present on Chat
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(500);
    const blockBanner = page.locator('.checkBlockBanner, [class*="CheckBlock"]');
    proof.checks.checkBlockBanner = (await blockBanner.count()) > 0;
    if (proof.checks.checkBlockBanner) {
      proof.screenshots.block135 = join(RECEIPT_DIR, '135-culture-ci-block.png');
      await blockBanner.first().screenshot({ path: proof.screenshots.block135 });
    } else {
      proof.screenshots.chatRepeat135 = join(RECEIPT_DIR, '135-culture-ci-demo', '04-chat-ready-for-block-demo.png');
      await page.screenshot({ path: proof.screenshots.chatRepeat135, fullPage: false });
      proof.checks.checkBlockBannerNote = 'Block banner not triggered in automated capture — runbook steps 1–7 for live block shot.';
    }

    proof.ok = proof.checks.noCliString && proof.checks.noMemFsString && proof.checks.checksSurfaceVisible;
  } finally {
    await browser.close().catch(() => {});
  }

  const outJson = join(RECEIPT_DIR, `ticket-proof-${RUN_ID}.json`);
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
