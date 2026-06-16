import type { Page } from '@playwright/test';

export async function dismissOnboarding(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem('otto.onboarded.v1', '1');
    } catch {
      /* ignore */
    }
  });
  const overlay = page.locator('.onboardOverlay');
  if ((await overlay.count()) > 0) {
    const skip = page.getByRole('button', { name: /^Skip/ });
    if ((await skip.count()) > 0) {
      await skip.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const done = page.getByRole('button', { name: /^Done$/ });
    if ((await done.count()) > 0) {
      await done.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    if ((await overlay.count()) > 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
    }
  }
  await overlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

export async function waitForStatus(
  page: Page,
  predicate: (status: { ready?: boolean } | undefined) => boolean,
  timeoutMs: number,
): Promise<{ ready?: boolean }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await page.evaluate(() => window.otto?.runtime?.status?.());
    if (predicate(status)) return status;
    await page.waitForTimeout(500);
  }
  throw new Error('runtime status predicate not satisfied in time');
}
