import { homedir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  DEFAULT_DIST_APP,
  RECEIPT_DIR,
  RUN_ID,
  assertSafeAppTemplate,
  prepareDisposableAppBundle,
  resolveGitHead,
  runCdpSession,
  writeProofReceipt,
} from './fixtures/staging-cdp';
import { waitForStatus } from './helpers/onboarding';

const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? DEFAULT_DIST_APP;
const CDP_BASE = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9460);

test.describe.serial('onboarding smoke', () => {
  const proof: Record<string, unknown> = {
    ok: false,
    runId: RUN_ID,
    gitHead: resolveGitHead(),
    appTemplate: APP_TEMPLATE,
    receiptDir: RECEIPT_DIR,
    screenshots: {},
    checks: {},
    consoleMessages: [] as string[],
  };

  let smokeRoot: string;
  let appBin: string;

  test.beforeAll(() => {
    assertSafeAppTemplate(APP_TEMPLATE);
    ({ smokeRoot, appBin } = prepareDisposableAppBundle(APP_TEMPLATE, 'onboarding'));
  });

  test('069 connected-first welcome when runtime ready', async () => {
    const profileDir = join(smokeRoot, 'profile-connected-first');
    const lettaHome = homedir();

    try {
      await runCdpSession({
        appBin,
        profileDir,
        home: join(smokeRoot, 'home-connected-first'),
        port: CDP_BASE,
        envExtra: {
          HOME: lettaHome,
          OTTO_LETTA_SETTINGS_PATH: join(lettaHome, '.letta', 'settings.json'),
        },
        onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
        exercise: async (page) => {
          await page.waitForLoadState('domcontentloaded');
          await waitForStatus(page, (s) => s?.ready === true, 90000);
          (proof.checks as Record<string, unknown>).connectedFirstRuntimeReady = true;

          const welcome = page.getByRole('heading', {
            name: 'The behavior layer for persistent agents.',
          });
          const welcomeVisible = (await welcome.count()) > 0 && (await welcome.isVisible());
          (proof.checks as Record<string, unknown>).connectedFirstWelcomeVisible = welcomeVisible;

          const screenshots = proof.screenshots as Record<string, string>;
          screenshots.connectedFirst = join(RECEIPT_DIR, '069-connected-first-state.png');
          await page.screenshot({ path: screenshots.connectedFirst, fullPage: false });

          expect(welcomeVisible).toBe(true);
        },
      });
    } catch (error) {
      const checks = proof.checks as Record<string, unknown>;
      checks.connectedFirstRuntimeReady = checks.connectedFirstRuntimeReady ?? false;
      checks.connectedFirstWelcomeVisible = false;
      checks.connectedFirstError = String((error as Error).message ?? error);
      throw error;
    }
  });

  test('071–072 receipts CTA shows sample proof', async () => {
    await runCdpSession({
      appBin,
      profileDir: join(smokeRoot, 'profile-receipts-cta'),
      home: join(smokeRoot, 'home-receipts-cta'),
      port: CDP_BASE + 1,
      onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
      exercise: async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await page
          .getByRole('heading', { name: 'The behavior layer for persistent agents.' })
          .waitFor({ timeout: 15000 });
        await page.getByRole('button', { name: 'See what Receipts will prove' }).click();
        await page.getByRole('heading', { name: 'First Receipt' }).waitFor({ state: 'visible', timeout: 10000 });
        await page.getByText('Sample proof record').waitFor({ state: 'visible', timeout: 10000 });

        const checks = proof.checks as Record<string, unknown>;
        checks.receiptsCtaShowsSample = true;
        checks.receiptsCtaNotConnectDock =
          (await page.getByRole('heading', { name: 'Connect your runtime' }).count()) === 0;

        const screenshots = proof.screenshots as Record<string, string>;
        screenshots.receiptsSample = join(RECEIPT_DIR, '071-072-receipts-sample-onboarding.png');
        await page.screenshot({ path: screenshots.receiptsSample, fullPage: false });

        expect(checks.receiptsCtaShowsSample).toBe(true);
        expect(checks.receiptsCtaNotConnectDock).toBe(true);
      },
    });
  });

  test('072 primary CTA opens connect dock', async () => {
    await runCdpSession({
      appBin,
      profileDir: join(smokeRoot, 'profile-connect-cta'),
      home: join(smokeRoot, 'home-connect-cta'),
      port: CDP_BASE + 2,
      onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
      exercise: async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await page
          .getByRole('heading', { name: 'The behavior layer for persistent agents.' })
          .waitFor({ timeout: 15000 });
        await page.getByRole('button', { name: 'Get started →' }).click();
        await page.getByText('Connect your runtime').waitFor({ timeout: 8000 });

        (proof.checks as Record<string, unknown>).primaryCtaConnectStep = true;
        const screenshots = proof.screenshots as Record<string, string>;
        screenshots.connectStep = join(RECEIPT_DIR, '072-primary-connect-step.png');
        await page.screenshot({ path: screenshots.connectStep, fullPage: false });

        expect((proof.checks as Record<string, unknown>).primaryCtaConnectStep).toBe(true);
      },
    });
  });

  test('073 narrow layout step shell not covering composer', async () => {
    await runCdpSession({
      appBin,
      profileDir: join(smokeRoot, 'profile-narrow'),
      home: join(smokeRoot, 'home-narrow'),
      port: CDP_BASE + 3,
      viewport: { width: 880, height: 720 },
      onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
      exercise: async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await page
          .getByRole('heading', { name: 'The behavior layer for persistent agents.' })
          .waitFor({ timeout: 15000 });
        await page.getByRole('button', { name: 'Get started →' }).click();
        await page.getByText('Connect your runtime').waitFor({ timeout: 8000 });

        const composer = page.locator('textarea').first();
        await composer.waitFor({ state: 'visible', timeout: 8000 });
        const composerBox = await composer.boundingBox();
        const stepShell = page.locator('.onboardStepAnchor').first();
        const stepRect = (await stepShell.count()) ? await stepShell.boundingBox() : null;

        const checks = proof.checks as Record<string, unknown>;
        checks.narrowComposerVisible = Boolean(composerBox);
        checks.narrowStepShellVisible = Boolean(stepRect);
        if (composerBox && stepRect) {
          checks.narrowStepNotCoveringComposer =
            stepRect.y + stepRect.height <= composerBox.y ||
            stepRect.y >= composerBox.y + composerBox.height;
        }

        const screenshots = proof.screenshots as Record<string, string>;
        screenshots.narrowLayout = join(RECEIPT_DIR, '073-narrow-dock-layout.png');
        await page.screenshot({ path: screenshots.narrowLayout, fullPage: false });

        expect(checks.narrowComposerVisible).toBe(true);
        expect(checks.narrowStepNotCoveringComposer).toBe(true);
      },
    });
  });

  test.afterAll(() => {
    const checks = proof.checks as Record<string, unknown>;
    proof.ok =
      checks.connectedFirstRuntimeReady === true &&
      checks.connectedFirstWelcomeVisible === true &&
      checks.receiptsCtaShowsSample === true &&
      checks.receiptsCtaNotConnectDock === true &&
      checks.primaryCtaConnectStep === true &&
      checks.narrowComposerVisible === true &&
      checks.narrowStepNotCoveringComposer === true;

    writeProofReceipt(join(RECEIPT_DIR, `onboarding-smoke-${RUN_ID}.json`), proof);
  });
});
