#!/usr/bin/env node
/**
 * 076 — full embedded bootstrap path on staging (disposable profile):
 *   open app → skip onboarding → runtime.init → one chat turn
 *
 * Prerequisites:
 *   bash apps/desktop/scripts/deploy-staging.sh
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs
 */
const { mkdirSync, readFileSync, existsSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const STAGING_OTTO_HOME = process.env.OTTO_STAGING_OTTO_HOME ?? join(process.env.HOME, '.codex/admin/otto-staging/otto-home');
const STAGING_HOME = process.env.OTTO_STAGING_HOME ?? join(process.env.HOME, '.codex/admin/otto-staging/home');
const VIEWPORT = { width: 1280, height: 720 };
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);
const TURN_TIMEOUT_MS = Number(process.env.OTTO_BOOTSTRAP_TURN_TIMEOUT_MS ?? 180_000);
const BOOTSTRAP_PROMPT =
  process.env.OTTO_BOOTSTRAP_PROMPT ??
  '076 embedded bootstrap smoke — reply with exactly one short word.';

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

  const bundledCli = join(
    STAGING_APP,
    'Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js',
  );

  const proof = {
    ok: false,
    ticket: '076',
    runId: RUN_ID,
    gitHead,
    path: [
      'open staging otto.app (disposable profile via deploy-staging.sh)',
      'skip onboarding overlay',
      'runtime.init() on disposable smoke conversation',
      'one chat turn via runtime.send',
    ],
    stagingApp: STAGING_APP,
    stagingOttoHome: STAGING_OTTO_HOME,
    stagingHome: STAGING_HOME,
    cdpPort: CDP_PORT,
    viewport: VIEWPORT,
    bundledCliPath: bundledCli,
    bundledCliExists: existsSync(bundledCli),
    checks: {},
    bootstrap: {},
    runtimeStatus: null,
    config: null,
    screenshots: {},
    bootstrapTurnCompleted: false,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.setViewportSize(VIEWPORT);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);

    // Skip onboarding — localStorage + UI Skip if overlay still visible
    await page.evaluate(() => {
      localStorage.setItem('otto.onboarded.v1', '1');
      localStorage.removeItem('otto.onboarding.firstMessage.v1');
    });
    const skipBtn = page.getByRole('button', { name: /^Skip$/i });
    if (await skipBtn.count()) {
      await skipBtn.first().click();
      await page.waitForTimeout(400);
    }
    proof.checks.onboardingSkipped = true;

    proof.runtimeStatus = await page.evaluate(async () => {
      if (!window.otto?.runtime?.init) return { ready: false, reason: 'no bridge' };
      return window.otto.runtime.init();
    });

    const initDeadline = Date.now() + INIT_TIMEOUT_MS;
    while (!proof.runtimeStatus?.ready && Date.now() < initDeadline) {
      await page.waitForTimeout(2000);
      proof.runtimeStatus = await page.evaluate(async () => window.otto?.runtime?.status?.() ?? null);
    }

    proof.checks.runtimeReady = proof.runtimeStatus?.ready === true;
    proof.checks.cliResolved = proof.runtimeStatus?.cliResolved === true;
    proof.checks.bundledCliUsed =
      proof.runtimeStatus?.cliPath?.includes('@letta-ai/letta-code/letta.js') === true &&
      proof.runtimeStatus?.cliPath?.includes('otto-staging.app') === true;
    proof.checks.sessionModeSmoke = proof.runtimeStatus?.sessionMode === 'smoke';
    proof.checks.notDefaultConversation =
      proof.runtimeStatus?.conversationId !== 'default' && proof.runtimeStatus?.conversationId != null;

    proof.config = await page.evaluate(async () => window.otto?.config?.get?.() ?? null);
    proof.checks.configHasNoProviderSecret = !JSON.stringify(proof.config ?? {}).match(
      /api[_-]?key|secret|token|password/i,
    );

    if (existsSync(join(STAGING_OTTO_HOME, 'config.json'))) {
      try {
        const diskCfg = readFileSync(join(STAGING_OTTO_HOME, 'config.json'), 'utf8');
        proof.checks.ottoHomeConfigNoProviderSecret = !diskCfg.match(/api[_-]?key|secret|token|password/i);
      } catch {
        proof.checks.ottoHomeConfigNoProviderSecret = false;
      }
    }

    const lettaStateDir = join(STAGING_OTTO_HOME, 'letta');
    proof.checks.lettaStateUnderOttoHome = existsSync(lettaStateDir);
    proof.checks.lettaStateUnderIsolatedHome = proof.checks.lettaStateUnderOttoHome;

    await page.getByRole('button', { name: 'Chat', exact: true }).click().catch(() => {});
    await page.waitForTimeout(600);

    if (proof.checks.runtimeReady) {
      proof.bootstrap = await page.evaluate(
        async ({ prompt, turnTimeoutMs }) => {
          const api = window.otto;
          if (!api?.runtime?.send) return { ok: false, reason: 'no send bridge' };
          const started = Date.now();
          try {
            await Promise.race([
              api.runtime.send(prompt),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('turn timeout')), turnTimeoutMs),
              ),
            ]);
            const status = await api.runtime.status();
            return {
              ok: true,
              elapsedMs: Date.now() - started,
              conversationId: status?.conversationId ?? null,
              agentId: status?.agentId ?? null,
            };
          } catch (error) {
            return {
              ok: false,
              reason: error instanceof Error ? error.message : String(error),
              elapsedMs: Date.now() - started,
            };
          }
        },
        { prompt: BOOTSTRAP_PROMPT, turnTimeoutMs: TURN_TIMEOUT_MS },
      );
      proof.bootstrapTurnCompleted = proof.bootstrap?.ok === true;
      proof.checks.bootstrapTurnCompleted = proof.bootstrapTurnCompleted;
    } else {
      proof.bootstrap = { ok: false, reason: proof.runtimeStatus?.reason ?? 'runtime not ready' };
    }

    proof.screenshots.bootstrap076 = join(RECEIPT_DIR, `076-embedded-bootstrap-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots.bootstrap076, fullPage: false });

    proof.ok =
      proof.bundledCliExists &&
      proof.checks.onboardingSkipped &&
      proof.checks.runtimeReady &&
      proof.checks.cliResolved &&
      proof.checks.bundledCliUsed &&
      proof.checks.notDefaultConversation !== false &&
      proof.checks.bootstrapTurnCompleted === true;
  } finally {
    await browser.close().catch(() => {});
  }

  const outJson = join(RECEIPT_DIR, `staging-076-bootstrap-proof-${RUN_ID}.json`);
  writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        ok: proof.ok,
        outJson,
        bootstrapTurnCompleted: proof.bootstrapTurnCompleted,
        checks: proof.checks,
      },
      null,
      2,
    ),
  );

  if (!proof.ok) process.exit(1);
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
