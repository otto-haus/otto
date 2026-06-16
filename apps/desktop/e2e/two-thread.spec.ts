import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  DEFAULT_STAGING_APP,
  RECEIPT_DIR,
  RUN_ID,
  assertSafeAppTemplate,
  prepareDisposableAppBundle,
  readActiveState,
  resolveGitHead,
  runCdpSession,
  writeProofReceipt,
} from './fixtures/staging-cdp';
import { dismissOnboarding } from './helpers/onboarding';

const APP_TEMPLATE = process.env.OTTO_APP_BUNDLE ?? DEFAULT_STAGING_APP;
const CDP_BASE = Number(process.env.OTTO_STAGING_CDP_BASE ?? 9470);
const MSG_A = `046-smoke-thread-a-${RUN_ID}`;
const MSG_B = `046-smoke-thread-b-${RUN_ID}`;

test.describe.serial('046 two-thread isolation', () => {
  test('threads stay isolated across switch and relaunch', async () => {
    assertSafeAppTemplate(APP_TEMPLATE, { allowStagingApp: true });

    const { smokeRoot, appBin } = prepareDisposableAppBundle(APP_TEMPLATE, 'two-thread');
    const profileDir = join(smokeRoot, 'profile');
    const home = join(smokeRoot, 'home');

    const proof: Record<string, unknown> = {
      ok: false,
      runId: RUN_ID,
      gitHead: resolveGitHead(),
      appTemplate: APP_TEMPLATE,
      receiptDir: RECEIPT_DIR,
      markers: { threadA: MSG_A, threadB: MSG_B },
      screenshots: {},
      checks: {},
      threads: {},
      storageKeys: {},
      consoleMessages: [] as string[],
    };

    await runCdpSession({
      appBin,
      profileDir,
      home,
      port: CDP_BASE,
      onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
      exercise: async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await dismissOnboarding(page);
        await page.waitForFunction(() => typeof window.otto?.threads?.list === 'function', null, {
          timeout: 30000,
        });

        const threadA = await page.evaluate(async (msgA) => {
          const list = await window.otto.threads.list();
          const activeId = list.activeThreadId;
          const thread = list.threads.find((t) => t.id === activeId) ?? list.threads[0];
          if (!thread) throw new Error('no initial thread');
          const key = `otto.chat.messages.${thread.id}.v1`;
          localStorage.setItem(key, JSON.stringify([{ id: 'smoke-a', who: 'user', text: msgA }]));
          await window.otto.threads.touch({ title: `Thread A ${msgA.slice(-8)}` });
          return { id: thread.id, key, title: thread.title };
        }, MSG_A);
        (proof.threads as Record<string, unknown>).a = threadA;

        await page.getByRole('button', { name: 'New chat' }).click();
        await page.waitForTimeout(600);

        const threadB = await page.evaluate(async (msgB) => {
          const list = await window.otto.threads.list();
          const activeId = list.activeThreadId;
          const thread = list.threads.find((t) => t.id === activeId);
          if (!thread) throw new Error('no thread B after New chat');
          const key = `otto.chat.messages.${thread.id}.v1`;
          localStorage.setItem(key, JSON.stringify([{ id: 'smoke-b', who: 'user', text: msgB }]));
          await window.otto.threads.touch({ title: `Thread B ${msgB.slice(-8)}` });
          return { id: thread.id, key, title: thread.title };
        }, MSG_B);
        (proof.threads as Record<string, unknown>).b = threadB;

        const checks = proof.checks as Record<string, unknown>;
        checks.distinctThreadIds = threadA.id !== threadB.id;
        checks.distinctStorageKeys = threadA.key !== threadB.key;

        await page.evaluate(async (threadId) => {
          await window.otto.threads.switch(threadId);
        }, threadA.id);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await dismissOnboarding(page);
        await page.waitForTimeout(800);

        const afterSwitchA = await readActiveState(page);
        checks.threadAShowsMarker = afterSwitchA.visibleText.includes(MSG_A);
        checks.threadAHidesMarkerB = !afterSwitchA.visibleText.includes(MSG_B);
        (proof.storageKeys as Record<string, unknown>).threadA = afterSwitchA.storage;

        const screenshots = proof.screenshots as Record<string, string>;
        screenshots.threadA = join(RECEIPT_DIR, `046-two-thread-a-${RUN_ID}.png`);
        await page
          .locator('.chat')
          .first()
          .screenshot({ path: screenshots.threadA })
          .catch(async () => {
            await page.screenshot({ path: screenshots.threadA, fullPage: false });
          });

        await page.evaluate(async (threadId) => {
          await window.otto.threads.switch(threadId);
        }, threadB.id);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await dismissOnboarding(page);
        await page.waitForTimeout(800);

        const afterSwitchB = await readActiveState(page);
        checks.threadBShowsMarker = afterSwitchB.visibleText.includes(MSG_B);
        checks.threadBHidesMarkerA = !afterSwitchB.visibleText.includes(MSG_A);
        (proof.storageKeys as Record<string, unknown>).threadB = afterSwitchB.storage;

        screenshots.threadB = join(RECEIPT_DIR, `046-two-thread-b-${RUN_ID}.png`);
        await page
          .locator('.chat')
          .first()
          .screenshot({ path: screenshots.threadB })
          .catch(async () => {
            await page.screenshot({ path: screenshots.threadB, fullPage: false });
          });

        checks.sidebarThreadCount = await page.locator('.sidebar__threads .thread').count();

        const composer = page.locator('textarea[aria-label="Message Otto"]');
        if (await composer.isEnabled().catch(() => false)) {
          await composer.fill(`046-ui-send-${RUN_ID}`);
          await page.getByRole('button', { name: 'Send message' }).click();
          await page.waitForTimeout(500);
          checks.uiSendAttempted = true;
        } else {
          checks.uiSendAttempted = false;
          checks.uiSendSkippedReason = 'composer disabled (runtime not ready)';
        }
      },
    });

    await runCdpSession({
      appBin,
      profileDir,
      home,
      port: CDP_BASE + 1,
      onConsole: (type, text) => (proof.consoleMessages as string[]).push(`${type}: ${text}`),
      exercise: async (page) => {
        await page.waitForLoadState('domcontentloaded');
        await dismissOnboarding(page);
        await page.waitForFunction(() => typeof window.otto?.threads?.list === 'function', null, {
          timeout: 30000,
        });

        const threads = proof.threads as { a?: { id: string }; b?: { id: string } };
        const list = await page.evaluate(async () => {
          const r = await window.otto.threads.list();
          return {
            activeThreadId: r.activeThreadId,
            threads: r.threads.map((t) => ({ id: t.id, title: t.title })),
          };
        });

        const checks = proof.checks as Record<string, unknown>;
        checks.relaunchThreadCount = list.threads.length;
        checks.relaunchHasThreadA = list.threads.some((t) => t.id === threads.a?.id);
        checks.relaunchHasThreadB = list.threads.some((t) => t.id === threads.b?.id);

        await page.evaluate(async (threadId) => {
          await window.otto.threads.switch(threadId);
        }, threads.a!.id);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await dismissOnboarding(page);
        await page.waitForTimeout(800);

        const afterQuitA = await readActiveState(page);
        checks.relaunchThreadAShowsMarker = afterQuitA.visibleText.includes(MSG_A);
        checks.relaunchThreadAHidesMarkerB = !afterQuitA.visibleText.includes(MSG_B);
        (proof.storageKeys as Record<string, unknown>).afterQuitA = afterQuitA.storage;

        const screenshots = proof.screenshots as Record<string, string>;
        screenshots.afterQuit = join(RECEIPT_DIR, `046-after-quit-${RUN_ID}.png`);
        await page
          .locator('.sidebar')
          .first()
          .screenshot({ path: screenshots.afterQuit })
          .catch(async () => {
            await page.screenshot({ path: screenshots.afterQuit, fullPage: false });
          });
      },
    });

    const checks = proof.checks as Record<string, unknown>;
    checks.relaunchOk =
      checks.relaunchHasThreadA === true &&
      checks.relaunchHasThreadB === true &&
      checks.relaunchThreadAShowsMarker === true &&
      checks.relaunchThreadAHidesMarkerB === true &&
      (checks.relaunchThreadCount as number) >= 2;

    proof.ok =
      checks.distinctThreadIds === true &&
      checks.distinctStorageKeys === true &&
      checks.threadAShowsMarker === true &&
      checks.threadAHidesMarkerB === true &&
      checks.threadBShowsMarker === true &&
      checks.threadBHidesMarkerA === true &&
      (checks.sidebarThreadCount as number) >= 2 &&
      checks.relaunchOk === true;

    const outJson = join(RECEIPT_DIR, `two-thread-smoke-${RUN_ID}.json`);
    writeProofReceipt(outJson, proof);

    expect(checks.distinctThreadIds).toBe(true);
    expect(checks.distinctStorageKeys).toBe(true);
    expect(checks.threadAShowsMarker).toBe(true);
    expect(checks.threadAHidesMarkerB).toBe(true);
    expect(checks.threadBShowsMarker).toBe(true);
    expect(checks.threadBHidesMarkerA).toBe(true);
    expect(checks.sidebarThreadCount).toBeGreaterThanOrEqual(2);
    expect(checks.relaunchOk).toBe(true);
  });
});
