#!/usr/bin/env node
/**
 * #673 — Kill embedded letta.js mid-session → re-init recovery on staging.
 *
 * Prerequisites:
 *   OTTO_STAGING_REQUIRE_MAIN=0 task staging:build
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-staging-kill-mid-session-smoke.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

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
    ticket: '673',
    runId: RUN_ID,
    gitHead,
    stagingApp: STAGING_APP,
    scenario: 'kill embedded letta.js mid-session → re-init recovery',
    checks: {},
    kill: {},
    reinit: {},
    blockers: [],
    runtimeStatusBefore: null,
    runtimeStatusAfter: null,
  };

  const appBin = join(STAGING_APP, 'Contents/MacOS/otto');
  const profile = join(process.env.HOME, '.codex/admin/otto-staging/profile');
  const child = spawn(
    appBin,
    [`--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`],
    {
      detached: false,
      env: {
        ...process.env,
        OTTO_HOME: join(process.env.HOME, '.codex/admin/otto-staging/otto-home'),
        HOME: join(process.env.HOME, '.codex/admin/otto-staging/home'),
        OTTO_SMOKE: '1',
        OTTO_WINDOW_MODE: 'background',
      },
      stdio: 'ignore',
    },
  );

  try {
    await waitForCdp(CDP_PORT);
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    try {
      const ctx = browser.contexts()[0];
      const page = ctx.pages()[0] ?? (await ctx.waitForEvent('page', { timeout: 15000 }));
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.evaluate(() => localStorage.setItem('otto.onboarded.v1', '1'));

      proof.runtimeStatusBefore = await page.evaluate(async () => window.otto?.runtime?.init?.() ?? { ready: false, reason: 'no bridge' });
      const deadline = Date.now() + 120_000;
      while (!proof.runtimeStatusBefore?.ready && Date.now() < deadline) {
        await page.waitForTimeout(2000);
        proof.runtimeStatusBefore = await page.evaluate(async () => window.otto?.runtime?.status?.() ?? null);
      }
      proof.checks.initReady = proof.runtimeStatusBefore?.ready === true;
      if (!proof.checks.initReady) proof.blockers.push(proof.runtimeStatusBefore?.reason ?? 'init not ready');

      const psOut = execFileSync('ps', ['-eo', 'pid,command'], { encoding: 'utf8' });
      const lines = psOut.split('\n').filter((l) => l.includes('letta.js') && l.includes('otto-staging'));
      proof.kill.lettaProcessesBefore = lines.map((l) => l.trim());
      const targetPid = lines.length ? Number(lines[0].trim().split(/\s+/)[0]) : null;
      proof.kill.targetPid = targetPid;

      if (targetPid) {
        execFileSync('kill', ['-9', String(targetPid)]);
        proof.kill.killed = true;
        await page.waitForTimeout(1500);
        const psAfter = execFileSync('ps', ['-eo', 'pid,command'], { encoding: 'utf8' });
        proof.kill.lettaProcessesAfterKill = psAfter
          .split('\n')
          .filter((l) => l.includes('letta.js') && l.includes('otto-staging'))
          .map((l) => l.trim());
      } else {
        proof.kill.killed = false;
        proof.blockers.push('no letta.js pid to kill');
      }

      proof.reinit = await page.evaluate(async () => {
        try {
          const status = await window.otto.runtime.init();
          return { ok: status?.ready === true, status };
        } catch (e) {
          return { ok: false, reason: e instanceof Error ? e.message : String(e) };
        }
      });
      proof.runtimeStatusAfter = proof.reinit.status ?? null;
      proof.checks.reinitReady = proof.reinit.ok === true;
      if (!proof.checks.reinitReady) {
        proof.blockers.push(proof.reinit.reason ?? proof.reinit.status?.reason ?? 'reinit failed');
      }

      proof.ok = proof.checks.initReady && proof.kill.killed && proof.checks.reinitReady;
    } finally {
      await browser.close().catch(() => {});
    }
  } finally {
    try {
      process.kill(child.pid, 'SIGTERM');
    } catch {
      /* ignore */
    }
    execFileSync('pkill', ['-f', `${STAGING_APP}/Contents/MacOS/otto`], { stdio: 'ignore' });
  }

  const outJson = join(RECEIPT_DIR, `staging-673-kill-mid-session-${RUN_ID}.json`);
  writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks, blockers: proof.blockers, kill: proof.kill }, null, 2));
  if (!proof.ok) process.exit(1);
}

async function waitForCdp(port, attempts = 80) {
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
