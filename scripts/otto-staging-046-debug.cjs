#!/usr/bin/env node
/** Quick 046 localStorage diagnostic against staging CDP. */
const { chromium } = require('playwright');

const PORT = 9445;
const MARKER = `046-debug-${Date.now()}`;

async function main() {
  await waitForCdp(PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const page = browser.contexts()[0]?.pages()[0] ?? (await browser.contexts()[0].waitForEvent('page'));
  await page.getByRole('button', { name: 'Chat', exact: true }).click().catch(() => {});
  await page.waitForTimeout(800);

  const before = await dumpStorage(page);
  const thread = await page.evaluate(async () => {
    const list = await window.otto.threads.list();
    return { active: list.activeThreadId };
  });

  const composer = page.locator('textarea[aria-label="Message Otto"]');
  await composer.fill(MARKER);
  await page.getByRole('button', { name: /Send message|Queue message/i }).click();

  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const bubble = await page.evaluate((m) => {
      return [...document.querySelectorAll('.msg--user .msg__body')].some((el) => (el.textContent ?? '').includes(m));
    }, MARKER);
    const after = await dumpStorage(page, MARKER);
    if (bubble) {
      console.log(JSON.stringify({ marker: MARKER, thread, bubble, after, before }, null, 2));
      await browser.close();
      return;
    }
  }
  console.log(JSON.stringify({ marker: MARKER, thread, bubble: false, after: await dumpStorage(page, MARKER), before }, null, 2));
  await browser.close();
  process.exit(1);
}

async function dumpStorage(page, marker) {
  return page.evaluate((m) => {
    const keys = Object.keys(localStorage).filter((k) => k.includes('otto.chat.messages'));
    return keys.map((key) => ({
      key,
      hasMarker: m ? (localStorage.getItem(key)?.includes(m) ?? false) : false,
      len: (localStorage.getItem(key) ?? '').length,
      sample: (localStorage.getItem(key) ?? '').slice(0, 240),
    }));
  }, marker ?? null);
}

async function waitForCdp(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('CDP not ready');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
