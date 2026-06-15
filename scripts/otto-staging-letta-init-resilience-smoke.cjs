#!/usr/bin/env node
/**
 * #570 — Letta init resilience on staging (white screen / infinite booting gate).
 *
 * Prerequisites:
 *   OTTO_STAGING_REQUIRE_MAIN=0 task staging:build
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-letta-init-resilience-smoke.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const INIT_BUDGET_MS = Number(process.env.OTTO_INIT_RESILIENCE_BUDGET_MS ?? 50_000);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function lettaListeningOnLoopback() {
  if (process.env.OTTO_SKIP_LETTA_LSOF === '1') return false;
  if (process.platform !== 'darwin') return false;
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { timeout: 3000, encoding: 'utf8' });
    return /letta/i.test(out) && /(?:127\.0\.0\.1|localhost):\d+/i.test(out);
  } catch {
    return false;
  }
}

async function main() {
  if (!STAGING_APP.includes('staging')) {
    throw new Error(`Refusing non-staging app path: ${STAGING_APP}`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });

  let gitHead = process.env.OTTO_GIT_HEAD;
  if (!gitHead) {
    try {
      gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      gitHead = 'unknown';
    }
  }

  const proof = {
    ok: false,
    issue: 570,
    runId: RUN_ID,
    gitHead,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    initBudgetMs: INIT_BUDGET_MS,
    scenario: null,
    checks: {},
    runtimeStatus: null,
    existingModeStatus: null,
    initElapsedMs: null,
    lettaListening: lettaListeningOnLoopback(),
    unitTestCoverage: [
      'apps/desktop/electron/runtime-transport/letta-discovery.test.ts#resolveInitBaseUrl',
      'apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts#init resilience',
      'apps/desktop/electron/runtime-transport/runtime-common.test.ts#withTimeout',
    ],
  };

  const started = Date.now();
  await waitForCdp(CDP_PORT, INIT_BUDGET_MS);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.waitForLoadState('domcontentloaded');

    const statusPromise = page.evaluate(async () => {
      const api = window.otto?.runtime;
      if (!api?.init) return { error: 'otto.runtime.init missing' };
      const t0 = Date.now();
      const status = await api.init();
      return { status, elapsedMs: Date.now() - t0 };
    });

    const raced = await Promise.race([
      statusPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`init did not return within ${INIT_BUDGET_MS}ms`)), INIT_BUDGET_MS)),
    ]);

    proof.initElapsedMs = raced.elapsedMs;
    proof.runtimeStatus = raced.status;
    proof.checks.initReturnedWithinBudget = proof.initElapsedMs <= INIT_BUDGET_MS;
    proof.checks.notInfiniteBooting = true;

    const code = proof.runtimeStatus?.code;
    const ready = proof.runtimeStatus?.ready === true;
    const reason = String(proof.runtimeStatus?.reason ?? '');

    if (proof.lettaListening) {
      proof.scenario = 'letta-open';
      proof.checks.lettaOpenConnected = ready;
    } else {
      proof.scenario = 'letta-closed';
      const embeddedAutoStart = ready && String(proof.runtimeStatus?.effectiveTransport ?? '').length > 0;
      proof.checks.embeddedModeAutoStart = embeddedAutoStart;
      proof.checks.lettaClosedUnreachableOrSetup =
        embeddedAutoStart
        || (!ready && (code === 'unreachable' || code === 'no-agent' || code === 'error' || reason.length > 0));
      proof.checks.honestErrorCopy =
        embeddedAutoStart
        || reason.includes('Local Letta backend is not running')
        || reason.includes('did not connect in time')
        || reason.includes("Can't reach the Letta backend")
        || reason.includes('Embedded Letta engine')
        || reason.includes('no agent');
    }

    if (!proof.lettaListening) {
      const existingResult = await page.evaluate(async () => {
        const conn = window.otto?.connection;
        const runtime = window.otto?.runtime;
        if (!conn?.save || !runtime?.init) return { error: 'connection.save or runtime.init missing' };
        const t0 = Date.now();
        const status = await conn.save({
          connectionMode: 'existing',
          baseUrl: 'local:/Users/seb/.letta/lc-local-backend',
        });
        return { status, elapsedMs: Date.now() - t0 };
      });
      proof.existingModeStatus = existingResult.status;
      proof.checks.existingModeFastFail =
        existingResult.elapsedMs < 5000
        && existingResult.status?.ready === false
        && (existingResult.status?.code === 'unreachable'
          || String(existingResult.status?.reason ?? '').includes('Local Letta backend is not running'));
    } else {
      proof.checks.embeddedModeAutoStart = ready && String(proof.runtimeStatus?.effectiveTransport ?? '').length > 0;
    }

    proof.ok = proof.checks.initReturnedWithinBudget && proof.checks.notInfiniteBooting && (
      proof.lettaListening
        ? proof.checks.lettaOpenConnected
        : (proof.checks.lettaClosedUnreachableOrSetup && proof.checks.existingModeFastFail)
    );

    const receiptPath = join(RECEIPT_DIR, `issue-570-letta-init-resilience-${RUN_ID}.json`);
    writeFileSync(receiptPath, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(`Wrote ${receiptPath}`);
    console.log(JSON.stringify(proof, null, 2));

    if (!proof.ok) process.exit(1);
  } finally {
    await browser.close();
    console.log(`Total wall time: ${Date.now() - started}ms`);
  }
}

async function waitForCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`CDP not ready on :${port} within ${timeoutMs}ms — run task staging:build first`);
}

async function firstPage(context) {
  for (const page of context.pages()) {
    if (!page.url().startsWith('devtools://')) return page;
  }
  return context.waitForEvent('page', { timeout: 15000 });
}
