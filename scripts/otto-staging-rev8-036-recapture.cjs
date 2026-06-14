#!/usr/bin/env node
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');

const RECEIPT_DIR = join(process.cwd(), 'docs/receipts/staging');
const JSON_PATH = join(RECEIPT_DIR, 'staging-rev8-proof-20260614070035.json');
const deferredSummary = 'rev8 staging proof — defer filter visibility';

async function clickInboxFilter(page, label) {
  const inboxTab = page.getByRole('tab', { name: 'Inbox', exact: true });
  if ((await inboxTab.count()) > 0) await inboxTab.first().click();
  await page.getByRole('tab', { name: label, exact: true }).last().click();
}

(async () => {
  const proof = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9445');
  const page = browser.contexts()[0].pages()[0];
  await page.getByRole('button', { name: 'Curation', exact: true }).click();
  await page.waitForTimeout(600);
  await clickInboxFilter(page, 'Pending');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(RECEIPT_DIR, '036-curation-pending-filter.png'), fullPage: false });
  const pendingListText = await page.locator('.split, .SplitLayout, .surfacePage').first().innerText().catch(() => '');
  await clickInboxFilter(page, 'Decided');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(RECEIPT_DIR, '036-curation-deferred-decided-filter.png'), fullPage: false });
  const decidedListText = await page.locator('.split, .SplitLayout, .surfacePage').first().innerText().catch(() => '');
  proof.tickets['036'].pendingListHasDeferred = pendingListText.includes(deferredSummary);
  proof.tickets['036'].decidedListHasDeferred = decidedListText.includes(deferredSummary);
  proof.tickets['036'].ok =
    proof.tickets['036'].status === 'deferred' &&
    proof.tickets['036'].decidedListHasDeferred &&
    !proof.tickets['036'].pendingListHasDeferred;
  proof.ok = Object.values(proof.tickets).every((t) => t?.ok !== false);
  writeFileSync(JSON_PATH, JSON.stringify(proof, null, 2) + '\n');
  browser.disconnect?.();
  console.log(JSON.stringify({ ok: proof.ok, ticket036: proof.tickets['036'] }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
