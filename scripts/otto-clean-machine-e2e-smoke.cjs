#!/usr/bin/env node
/**
 * Issue #291 — clean-machine end-to-end setup smoke.
 *
 * Starts from an isolated HOME/OTTO_HOME with no pre-existing Letta Desktop config,
 * uses a disposable copied app bundle (never /Applications/otto.app or otto-staging.app),
 * verifies onboarding/setup surfaces, embedded runtime init, and one chat turn.
 *
 * Prerequisites:
 *   bun run --cwd apps/desktop app:dir
 *   NODE_PATH=$HOME/.codex/admin/node_modules (playwright)
 *
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     node scripts/otto-clean-machine-e2e-smoke.cjs
 *
 * Packaging-only (no Electron launch):
 *   OTTO_CLEAN_MACHINE_PACKAGING_ONLY=1 node scripts/otto-clean-machine-e2e-smoke.cjs
 */
const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { homedir, tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawn } = require('node:child_process');

/**
 * Embedded Letta needs a provider credential to reach a real session — provider keys live in
 * Letta, never otto (docs/v1/embedded-letta-bundle.md). The clean profile deliberately has no
 * host ~/.letta config, so hydrate LETTA_API_KEY from the canonical real-home secret location
 * (same pattern as scripts/ws-disposable-smoke.ts) before HOME is isolated. We never copy
 * ~/.letta — only the provider credential flows through, exactly how keys reach Letta.
 */
function hydrateLettaApiKey() {
  if (process.env.LETTA_API_KEY?.trim()) return;
  const secretsPath = join(homedir(), '.otto', 'secrets.env');
  if (!existsSync(secretsPath)) return;
  for (const line of readFileSync(secretsPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0 && trimmed.slice(0, eq) === 'LETTA_API_KEY') {
      process.env.LETTA_API_KEY = trimmed.slice(eq + 1);
      break;
    }
  }
}

const ROOT = join(__dirname, '..');
const RUN_ID = process.env.OTTO_CLEAN_MACHINE_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(ROOT, 'docs/receipts/staging');
const DEFAULT_BUILT = join(ROOT, 'apps/desktop/dist-app/mac-arm64/otto.app');
const APP_TEMPLATE = process.env.OTTO_CLEAN_MACHINE_APP ?? DEFAULT_BUILT;
const SMOKE_ROOT = join(tmpdir(), `otto-clean-machine-${RUN_ID}`);
const APP_BUNDLE = join(SMOKE_ROOT, 'otto-clean-machine-smoke.app');
const APP_BIN = join(APP_BUNDLE, 'Contents/MacOS/otto');
const CDP_PORT = Number(process.env.OTTO_CLEAN_MACHINE_CDP_PORT ?? 9480);
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);
const TURN_TIMEOUT_MS = Number(process.env.OTTO_BOOTSTRAP_TURN_TIMEOUT_MS ?? 180_000);
const PROMPT =
  process.env.OTTO_CLEAN_MACHINE_PROMPT ??
  '291 clean-machine smoke — reply with exactly one short word.';
const PACKAGING_ONLY = process.env.OTTO_CLEAN_MACHINE_PACKAGING_ONLY === '1';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function assertSafeAppPath(appPath) {
  const normalized = appPath.replace(/\/+$/, '');
  if (normalized === '/Applications/otto.app' || normalized.startsWith('/Applications/otto.app/')) {
    throw new Error('Refusing live /Applications/otto.app');
  }
  if (normalized.includes('otto-staging.app')) {
    throw new Error('Refusing otto-staging.app — build dist-app or set OTTO_CLEAN_MACHINE_APP');
  }
}

function classifyFailure(proof) {
  if (!proof.checks.appBundleExists || !proof.checks.bundledCliExists) return 'packaging';
  if (proof.checks.onboardingWelcomeVisible !== true || proof.checks.connectDockReachable !== true) {
    return 'setup';
  }
  if (proof.checks.runtimeReady !== true) return 'runtime';
  if (proof.checks.chatTurnCompleted !== true) return 'chat';
  return null;
}

function nextActionForFailure(category, proof) {
  switch (category) {
    case 'packaging':
      return 'Build a packaged app: bun run --cwd apps/desktop app:dir (asar: false bundles embedded letta.js).';
    case 'setup':
      return 'Review onboarding/connect UI — welcome heading and Get started → connect dock must be reachable on a fresh profile.';
    case 'runtime':
      if (proof.checks.providerCredentialPresent !== true) {
        return 'Embedded runtime needs a provider credential to reach a real session (keys live in Letta, never otto). Export LETTA_API_KEY or add it to ~/.otto/secrets.env, then re-run.';
      }
      return proof.runtimeStatus?.reason
        ? `Fix runtime init: ${proof.runtimeStatus.reason}`
        : 'Embedded runtime did not reach ready — configure provider auth inside Letta for local v1.';
    case 'chat':
      return proof.chat?.reason
        ? `Fix chat turn: ${proof.chat.reason}`
        : 'Runtime was ready but first chat turn did not complete.';
    default:
      return null;
  }
}

async function main() {
  assertSafeAppPath(APP_TEMPLATE);
  hydrateLettaApiKey();

  mkdirSync(RECEIPT_DIR, { recursive: true });

  let gitHead = process.env.OTTO_GIT_HEAD;
  if (!gitHead) {
    try {
      gitHead = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8', cwd: ROOT }).trim();
    } catch {
      gitHead = null;
    }
  }

  const bundledCliTemplate = join(
    APP_TEMPLATE,
    'Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js',
  );

  const proof = {
    schema: 'otto.clean-machine-e2e-smoke.v1',
    issue: 291,
    ok: false,
    runId: RUN_ID,
    gitHead,
    appTemplate: APP_TEMPLATE,
    smokeRoot: SMOKE_ROOT,
    isolatedHome: join(SMOKE_ROOT, 'home'),
    isolatedOttoHome: join(SMOKE_ROOT, 'home', 'otto-home'),
    receiptDir: RECEIPT_DIR,
    path: [
      'resolve packaged otto.app from dist-app (never live or staging installs)',
      'copy to disposable temp bundle + isolated HOME/OTTO_HOME (no host .letta)',
      'verify onboarding welcome + connect dock on fresh profile',
      'embedded connectionMode + runtime.init() on disposable smoke conversation',
      'one chat turn via runtime.send',
    ],
    checks: {
      appBundleExists: existsSync(APP_TEMPLATE),
      bundledCliExists: existsSync(bundledCliTemplate),
      noHostLettaSettings: true,
      providerCredentialPresent: Boolean(process.env.LETTA_API_KEY?.trim()),
      notDefaultConversation: false,
      sessionModeSmoke: false,
      bundledCliUsed: false,
    },
    failureCategory: null,
    nextAction: null,
    runtimeStatus: null,
    chat: null,
    screenshots: {},
    consoleMessages: [],
  };

  if (!proof.checks.appBundleExists || !proof.checks.bundledCliExists) {
    proof.failureCategory = classifyFailure(proof);
    proof.nextAction = nextActionForFailure(proof.failureCategory, proof);
    return finish(proof, 1);
  }

  if (PACKAGING_ONLY) {
    proof.ok = true;
    proof.checks.packagingOnly = true;
    proof.notes = ['Packaging checks passed; full E2E skipped (OTTO_CLEAN_MACHINE_PACKAGING_ONLY=1).'];
    return finish(proof, 0);
  }

  rmSync(SMOKE_ROOT, { recursive: true, force: true });
  execFileSync('/usr/bin/ditto', [APP_TEMPLATE, APP_BUNDLE]);
  const safeRunId = RUN_ID.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  execFileSync('/usr/libexec/PlistBuddy', [
    '-c',
    `Set :CFBundleIdentifier haus.otto.desktop.clean-machine-smoke.${safeRunId}`,
    '-c',
    `Set :CFBundleDisplayName otto clean machine smoke ${RUN_ID}`,
    '-c',
    'Set :CFBundleName otto',
    join(APP_BUNDLE, 'Contents/Info.plist'),
  ]);
  execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', APP_BUNDLE]);

  const profileDir = join(SMOKE_ROOT, 'profile');
  const home = proof.isolatedHome;
  mkdirSync(home, { recursive: true });

  proof.checks.noHostLettaSettings = !existsSync(join(home, '.letta', 'settings.json'));

  await runSession({
    proof,
    profileDir,
    home,
    port: CDP_PORT,
    async exercise(page) {
      await page.waitForLoadState('domcontentloaded');

      const welcome = page.getByRole('heading', { name: 'The behavior layer for persistent agents.' });
      await welcome.waitFor({ timeout: 15000 });
      proof.checks.onboardingWelcomeVisible = (await welcome.count()) > 0 && (await welcome.isVisible());

      // Welcome → Get started opens the connection-mode picker on a fresh profile
      // (onboarding redesign #772: "How should otto connect?" with This Mac / Existing cards).
      await page.getByRole('button', { name: 'Get started →' }).click();
      const modePicker = page.getByRole('heading', { name: 'How should otto connect?' });
      await modePicker.waitFor({ timeout: 8000 });
      proof.checks.connectDockReachable = (await modePicker.count()) > 0 && (await modePicker.isVisible());
      proof.screenshots.setup = join(RECEIPT_DIR, `291-clean-machine-setup-${RUN_ID}.png`);
      await page.screenshot({ path: proof.screenshots.setup, fullPage: false });

      // Pick the embedded "This Mac" path and continue into the connect step.
      await page.getByRole('button', { name: /^This Mac/ }).click();
      await page.getByRole('button', { name: 'Continue →' }).click();
      await page.getByRole('heading', { name: 'Connect your runtime' }).waitFor({ timeout: 8000 }).catch(() => {});

      await page.evaluate(async () => {
        localStorage.setItem('otto.onboarded.v1', '1');
        if (window.otto?.config?.set) {
          await window.otto.config.set({ connectionMode: 'embedded' });
        }
      });
      const skipBtn = page.getByRole('button', { name: /^Skip$/i });
      if (await skipBtn.count()) {
        await skipBtn.first().click().catch(() => {});
        await page.waitForTimeout(400);
      }

      proof.runtimeStatus = await page.evaluate(async () => {
        if (!window.otto?.runtime?.init) return { ready: false, reason: 'no runtime bridge' };
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
        proof.runtimeStatus?.cliPath?.includes('@letta-ai/letta-code/letta.js') === true;
      proof.checks.sessionModeSmoke = proof.runtimeStatus?.sessionMode === 'smoke';
      proof.checks.notDefaultConversation =
        proof.runtimeStatus?.conversationId !== 'default' && proof.runtimeStatus?.conversationId != null;
      proof.checks.lettaStateUnderIsolatedHome = existsSync(join(home, 'otto-home', 'letta'));

      if (proof.checks.runtimeReady) {
        proof.chat = await page.evaluate(
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
          { prompt: PROMPT, turnTimeoutMs: TURN_TIMEOUT_MS },
        );
        proof.checks.chatTurnCompleted = proof.chat?.ok === true;
      } else {
        proof.chat = { ok: false, reason: proof.runtimeStatus?.reason ?? 'runtime not ready' };
        proof.checks.chatTurnCompleted = false;
      }

      proof.screenshots.final = join(RECEIPT_DIR, `291-clean-machine-final-${RUN_ID}.png`);
      await page.screenshot({ path: proof.screenshots.final, fullPage: false });
    },
  }).catch((error) => {
    proof.checks.sessionError = String(error.message ?? error);
  });

  proof.ok =
    proof.checks.onboardingWelcomeVisible === true &&
    proof.checks.connectDockReachable === true &&
    proof.checks.runtimeReady === true &&
    proof.checks.notDefaultConversation !== false &&
    proof.checks.sessionModeSmoke === true &&
    proof.checks.chatTurnCompleted === true;

  if (!proof.ok) {
    proof.failureCategory = classifyFailure(proof);
    proof.nextAction = nextActionForFailure(proof.failureCategory, proof);
  }

  return finish(proof, proof.ok ? 0 : 1);
}

function finish(proof, code) {
  const outJson = join(RECEIPT_DIR, `clean-machine-e2e-${RUN_ID}.json`);
  writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok: proof.ok,
        outJson,
        failureCategory: proof.failureCategory,
        nextAction: proof.nextAction,
        checks: proof.checks,
      },
      null,
      2,
    ),
  );
  process.exit(code);
}

async function runSession({ proof, profileDir, home, port, exercise }) {
  const { chromium } = require('playwright');
  const ottoHome = join(home, 'otto-home');
  mkdirSync(ottoHome, { recursive: true });

  const app = spawn(APP_BIN, [`--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`], {
    env: {
      ...process.env,
      HOME: home,
      OTTO_HOME: ottoHome,
      OTTO_SMOKE: '1',
      OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
      OTTO_SKIP_LETTA_LSOF: '1',
      OTTO_CLEAN_MACHINE_SMOKE: '1',
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
