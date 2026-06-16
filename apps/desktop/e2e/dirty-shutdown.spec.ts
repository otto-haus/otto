import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  DEFAULT_DIST_APP,
  RECEIPT_DIR,
  RUN_ID,
  assertSafeAppTemplate,
  prepareDisposableAppBundle,
  resolveGitHead,
  waitForCdp,
  writeProofReceipt,
} from './fixtures/staging-cdp';
import { dismissOnboarding } from './helpers/onboarding';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? DEFAULT_DIST_APP;
const CDP_PORT = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9485);

async function launchApp(
  appBin: string,
  profileDir: string,
  home: string,
): Promise<ChildProcess> {
  mkdirSync(home, { recursive: true });
  mkdirSync(profileDir, { recursive: true });
  return spawn(
    appBin,
    [`--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profileDir}`],
    {
      env: {
        ...process.env,
        HOME: home,
        OTTO_HOME: join(home, 'otto-home'),
        OTTO_SMOKE: '1',
        OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
        OTTO_SKIP_LETTA_LSOF: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

async function withPage(exercise: (page: import('@playwright/test').Page) => Promise<void>): Promise<void> {
  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const context = browser.contexts()[0];
    let page = context.pages()[0];
    for (let i = 0; i < 40 && !page; i += 1) {
      await new Promise((r) => setTimeout(r, 250));
      page = context.pages()[0];
    }
    if (!page) throw new Error('No CDP page found');
    await exercise(page);
  } finally {
    await browser.close().catch(() => {});
  }
}

test.describe.serial('576 dirty shutdown + safe reset', () => {
  test('force-quit relaunch shows warning then safe reset clears it', async () => {
    assertSafeAppTemplate(APP_TEMPLATE);

    const { smokeRoot, appBin } = prepareDisposableAppBundle(APP_TEMPLATE, 'dirty-shutdown');
    const profileDir = join(smokeRoot, 'profile');
    const home = join(smokeRoot, 'home');

    const proof: Record<string, unknown> = {
      ok: false,
      runId: RUN_ID,
      gitHead: resolveGitHead(),
      appTemplate: APP_TEMPLATE,
      receiptDir: RECEIPT_DIR,
      checks: {} as Record<string, unknown>,
    };

    let app = await launchApp(appBin, profileDir, home);
    try {
      await withPage(async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await dismissOnboarding(page);
        await page.waitForFunction(() => typeof window.otto?.system?.shutdownStatus === 'function', null, {
          timeout: 30000,
        });
        const cleanStart = await page.evaluate(async () => window.otto.system.shutdownStatus());
        (proof.checks as Record<string, unknown>).cleanStart = cleanStart;
        expect(cleanStart.dirtyShutdown).toBe(false);
      });
    } finally {
      app.kill('SIGKILL');
      await new Promise((r) => app.once('exit', r));
    }

    app = await launchApp(appBin, profileDir, home);
    try {
      await withPage(async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await dismissOnboarding(page);
        await page.waitForFunction(() => typeof window.otto?.system?.shutdownStatus === 'function', null, {
          timeout: 30000,
        });

        const dirtyStart = await page.evaluate(async () => window.otto.system.shutdownStatus());
        (proof.checks as Record<string, unknown>).dirtyStart = dirtyStart;
        expect(dirtyStart.dirtyShutdown).toBe(true);

        await page.evaluate(() => {
          location.hash = 'settings/diagnostics';
        });
        await page.waitForTimeout(500);
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText).toContain('did not shut down cleanly');

        const resetResult = await page.evaluate(async () => window.otto.system.safeReset());
        (proof.checks as Record<string, unknown>).safeReset = resetResult;
        expect(resetResult.ok).toBe(true);

        const afterReset = await page.evaluate(async () => window.otto.system.shutdownStatus());
        (proof.checks as Record<string, unknown>).afterReset = afterReset;
        expect(afterReset.dirtyShutdown).toBe(false);
      });

      proof.ok = true;
      writeProofReceipt(join(RECEIPT_DIR, `576-dirty-shutdown-${RUN_ID}.json`), proof);
    } finally {
      app.kill('SIGTERM');
      await new Promise((r) => app.once('exit', r));
    }
  });
});
