#!/usr/bin/env node
/**
 * Ticket 159 staging proof: strict WS chat loop.
 *
 * Preconditions:
 *   task staging
 *   NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-159-chat-loop-proof.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const STAGING_ROOT = process.env.OTTO_STAGING_ROOT ?? join(process.env.HOME, '.codex/admin/otto-staging');
const PROFILE_DIR = process.env.OTTO_STAGING_PROFILE ?? join(STAGING_ROOT, 'profile');
const RECEIPT_BASE = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const RECEIPT_DIR = join(RECEIPT_BASE, `159-chat-core-working-loop-ws-${RUN_ID}`);
const TIMEOUT = Number(process.env.OTTO_159_PROOF_TIMEOUT_MS ?? 180000);

const marker = (name) => `OTTO_159_${name}_${RUN_ID}`;
const TITLE_A = `159 A ${RUN_ID}`;
const TITLE_B = `159 B ${RUN_ID}`;
const WORKSPACE_SURFACES = [
  ['charters', 'Charters'],
  ['standards', 'Standards'],
  ['practices', 'Practices'],
  ['routines', 'Routines'],
  ['curation', 'Curation'],
  ['receipts', 'Receipts'],
  ['checks', 'Checks'],
  ['autonomy', 'Autonomy'],
  ['skills', 'Skills'],
  ['knowledge', 'Knowledge'],
  ['tickets', 'Tickets'],
  ['channels', 'Channels'],
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!STAGING_APP.includes('staging')) {
    throw new Error(`Refusing non-staging app: ${STAGING_APP}`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  const proof = {
    ok: false,
    runId: RUN_ID,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    receiptDir: RECEIPT_DIR,
    markers: {
      a: marker('A'),
      b: marker('B'),
      model: marker('MODEL'),
      queue1: marker('QUEUE_1'),
      queue2: marker('QUEUE_2'),
      steer: marker('STEER'),
    },
    expected: {
      titleA: TITLE_A,
      titleB: TITLE_B,
    },
    checks: {},
    threads: {},
    models: {},
    workspace: {},
    status: {},
    errors: [],
    screenshots: {},
  };

  let browser = await connect();
  let page = await firstPage(browser);
  try {
    await setupPage(page);
    proof.initial = await readState(page);
    proof.status.initial = proof.initial.status;
    proof.checks.notBlank = proof.initial.bodyLen > 100;
    proof.checks.noSilentHang = proof.initial.status?.ready === true || proof.initial.setupHasRetry === true;
    proof.checks.commandStationAbsent = await commandStationAbsent(page);
    proof.checks.wsReady =
      proof.initial.status?.ready === true &&
      proof.initial.status?.transportMode === 'ws' &&
      proof.initial.status?.effectiveTransport === 'websocket local';

    const models = await page.evaluate(() => window.otto.models.list());
    proof.models.count = models.length;
    proof.models.gpt = pickModel(models, [/^openai\/gpt-5\.5$/, /^chatgpt-plus-pro\/gpt-5\.5$/]);
    proof.models.claude = pickModel(models, [/^anthropic\/claude-opus-4-8$/, /^anthropic\/claude-opus-4-/, /^anthropic\/claude-opus/]);
    proof.checks.modelRegistryHasGpt = !!proof.models.gpt;
    proof.checks.modelRegistryHasClaude = !!proof.models.claude;
    if (!proof.models.gpt) throw new Error('No GPT-5.5 model handle found in Letta model registry.');
    if (!proof.models.claude) throw new Error('No Claude Opus model handle found in Letta model registry.');

    await clearQueue(page);

    const threadA = await createViaNewChat(page, TITLE_A);
    proof.threads.a = threadA;
    await configureModel(page, proof.models.gpt.handle);
    proof.status.afterGptConfigure = await page.evaluate(() => window.otto.runtime.status());
    await sendViaComposer(page, `Reply with exactly ${proof.markers.a} and nothing else.`);
    await waitForAssistantMarker(page, threadA.id, proof.markers.a);
    proof.threads.aAfterSend = await getThread(page, threadA.id);
    proof.checks.renameNotOverwrittenByFirstSend = proof.threads.aAfterSend?.title === TITLE_A;

    const threadB = await createViaNewChat(page, TITLE_B);
    proof.threads.b = threadB;
    await sendViaComposer(page, `Reply with exactly ${proof.markers.b} and nothing else.`);
    await waitForAssistantMarker(page, threadB.id, proof.markers.b);
    proof.threads.bAfterSend = await getThread(page, threadB.id);

    proof.checks.twoConversations = threadA.id !== threadB.id;
    proof.checks.conversationIdsDistinct =
      !!proof.threads.aAfterSend?.lettaConversationId &&
      !!proof.threads.bAfterSend?.lettaConversationId &&
      proof.threads.aAfterSend.lettaConversationId !== proof.threads.bAfterSend.lettaConversationId;
    proof.checks.notDefaultConversation =
      proof.threads.aAfterSend?.lettaConversationId !== 'default' &&
      proof.threads.bAfterSend?.lettaConversationId !== 'default';

    await clickConversation(page, TITLE_A, threadA.id);
    const aVisible = await visibleAndStoredText(page, threadA.id);
    await clickConversation(page, TITLE_B, threadB.id);
    const bVisible = await visibleAndStoredText(page, threadB.id);
    proof.checks.switchActiveRowMoves = (await activeThreadId(page)) === threadB.id;
    proof.checks.noHistoryBleed =
      aVisible.stored.includes(proof.markers.a) &&
      !aVisible.stored.includes(proof.markers.b) &&
      bVisible.stored.includes(proof.markers.b) &&
      !bVisible.stored.includes(proof.markers.a);

    await clickConversation(page, TITLE_A, threadA.id);
    await clickThreadPin(page, TITLE_A);
    await waitForThread(page, threadA.id, (thread) => thread.pinned === true);
    proof.threads.aPinned = await getThread(page, threadA.id);
    proof.checks.pinPersistsInStore = proof.threads.aPinned?.pinned === true;
    proof.checks.pinButtonLeft = await page.locator('.sidebarConvWrap', { hasText: TITLE_A }).first().evaluate((row) => {
      const pin = row.querySelector('.sidebarConv__pin');
      const label = row.querySelector('.sidebarConv__label');
      if (!pin || !label) return false;
      return pin.getBoundingClientRect().left < label.getBoundingClientRect().left;
    });

    await clickConversation(page, TITLE_B, threadB.id);
    await clickThreadPin(page, TITLE_B);
    await waitForThread(page, threadB.id, (thread) => thread.pinned === true);
    proof.archiveClick = await archiveConversationTwoClick(page, TITLE_B);
    await waitForThread(page, threadB.id, (thread) => thread.archived === true, true);
    await waitReady(page);
    proof.threads.bArchived = await getThread(page, threadB.id, true);
    proof.afterArchive = await page.evaluate(() => window.otto.threads.list(false));
    proof.status.afterArchive = await page.evaluate(() => window.otto.runtime.status());
    proof.checks.archivePinnedWorks =
      proof.threads.bArchived?.archived === true &&
      proof.threads.bArchived?.pinned === false &&
      !proof.afterArchive.threads.some((thread) => thread.id === proof.threads.b.id);
    proof.checks.archiveActiveFallback =
      proof.afterArchive.activeThreadId &&
      proof.afterArchive.activeThreadId !== threadB.id &&
      proof.status.afterArchive.ready === true;
    proof.checks.archiveTwoClickSameLocation =
      proof.archiveClick?.beforeLabel === 'Archive conversation' &&
      proof.archiveClick?.armedLabel === 'Confirm archive' &&
      sameBoxCenter(proof.archiveClick?.before, proof.archiveClick?.armed);

    await clickConversation(page, TITLE_A, threadA.id);
    await configureModelViaPicker(page, proof.models.claude.handle);
    proof.status.afterClaudeConfigure = await page.evaluate(() => window.otto.runtime.status());
    await sendViaComposer(page, `Reply with exactly ${proof.markers.model} and nothing else.`);
    await waitForAssistantMarker(page, threadA.id, proof.markers.model, TIMEOUT);
    proof.threads.aAfterModelSend = await getThread(page, threadA.id);
    proof.checks.modelSwitchSend =
      proof.status.afterClaudeConfigure?.ready === true &&
      proof.status.afterClaudeConfigure?.modelHandle === proof.models.claude.handle &&
      (await assistantTextFor(page, threadA.id)).includes(proof.markers.model);
    proof.checks.renameNotOverwrittenByNextSend = proof.threads.aAfterModelSend?.title === TITLE_A;

    await proveQueueAndSteer(page, proof, threadA.id);

    proof.preRelaunch = await page.evaluate(() => window.otto.threads.list(true));
    proof.screenshots.beforeRelaunch = join(RECEIPT_DIR, 'before-relaunch.png');
    await page.screenshot({ path: proof.screenshots.beforeRelaunch, fullPage: false });

    await disconnectBrowser(browser);
    browser = null;
    relaunchStaging();

    browser = await connect();
    page = await firstPage(browser);
    await setupPage(page, { init: true });
    proof.afterRelaunch = await page.evaluate(() => window.otto.threads.list(true));
    proof.status.afterRelaunch = await page.evaluate(() => window.otto.runtime.status());
    const aAfterRelaunch = proof.afterRelaunch.threads.find((thread) => thread.id === threadA.id);
    const bAfterRelaunch = proof.afterRelaunch.threads.find((thread) => thread.id === threadB.id);
    proof.checks.relaunchRestore =
      proof.afterRelaunch.activeThreadId &&
      aAfterRelaunch?.pinned === true &&
      bAfterRelaunch?.archived === true &&
      proof.afterRelaunch.threads.some((thread) => thread.id === threadA.id);
    proof.checks.renamePersistsAfterRelaunch = aAfterRelaunch?.title === TITLE_A;
    proof.checks.renamePersistsAndNotOverwritten =
      proof.checks.renameNotOverwrittenByFirstSend === true &&
      proof.checks.renameNotOverwrittenByNextSend === true &&
      proof.checks.renamePersistsAfterRelaunch === true;

    await clickConversation(page, TITLE_A, threadA.id);
    await clickThreadPin(page, TITLE_A);
    await waitForThread(page, threadA.id, (thread) => thread.pinned === false);
    proof.threads.aUnpinned = await getThread(page, threadA.id);
    proof.checks.unpinReturnsToRecents = proof.threads.aUnpinned?.pinned === false;

    proof.finalVisible = await page.evaluate(() => window.otto.threads.list(false));
    proof.checks.recentsClean = proof.finalVisible.threads.every((thread) => {
      const title = String(thread.title || '');
      if (/^chat session$/i.test(title)) return false;
      if (/^046-debug-/i.test(title)) return false;
      if (/^\d{3}-(?:rev\d+-|smoke-)?thread-[ab]-\d{12,14}$/i.test(title)) return false;
      if (/^new chat$/i.test(title) && !thread.lettaConversationId && thread.id !== proof.finalVisible.activeThreadId) return false;
      return true;
    });
    proof.workspace = await proveWorkspaceSoon(page);
    proof.checks.workspaceSurfacesComingSoon = proof.workspace.ok === true;
    await page.locator('button[aria-label="Chat"]').first().click();
    await page.waitForSelector('.chat', { timeout: 10000 });

    proof.screenshots.final = join(RECEIPT_DIR, 'final.png');
    await page.screenshot({ path: proof.screenshots.final, fullPage: false });

    proof.ok = [
      'notBlank',
      'noSilentHang',
      'commandStationAbsent',
      'wsReady',
      'modelRegistryHasGpt',
      'modelRegistryHasClaude',
      'twoConversations',
      'conversationIdsDistinct',
      'notDefaultConversation',
      'switchActiveRowMoves',
      'noHistoryBleed',
      'pinPersistsInStore',
      'pinButtonLeft',
      'archivePinnedWorks',
      'archiveTwoClickSameLocation',
      'archiveActiveFallback',
      'modelSwitchSend',
      'renamePersistsAndNotOverwritten',
      'queueDrain',
      'steerChangedCourse',
      'queueFailureHonest',
      'relaunchRestore',
      'unpinReturnsToRecents',
      'recentsClean',
      'workspaceSurfacesComingSoon',
    ].every((key) => proof.checks[key] === true);
  } catch (error) {
    proof.errors.push(error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) });
    proof.screenshots.failure = join(RECEIPT_DIR, 'failure.png');
    await page?.screenshot({ path: proof.screenshots.failure, fullPage: false }).catch(() => {});
  } finally {
    if (browser) await disconnectBrowser(browser);
    const outJson = join(RECEIPT_DIR, 'proof.json');
    writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks, errors: proof.errors, models: proof.models }, null, 2));
    if (!proof.ok) process.exit(1);
  }
}

async function disconnectBrowser(browser) {
  if (!browser) return;
  if (typeof browser.disconnect === 'function') {
    browser.disconnect();
    return;
  }
  await browser.close().catch(() => {});
}

function pickModel(models, patterns) {
  for (const pattern of patterns) {
    const found = models.find((model) => pattern.test(model.handle));
    if (found) return found;
  }
  return null;
}

async function connect() {
  await waitForCdp(CDP_PORT);
  return chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
}

async function waitForCdp(port) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for CDP on ${port}`);
}

async function firstPage(browser) {
  const context = browser.contexts()[0] ?? await browser.newContext();
  let pages = context.pages();
  if (!pages.length) {
    const deadline = Date.now() + 15000;
    while (!pages.length && Date.now() < deadline) {
      await sleep(250);
      pages = context.pages();
    }
  }
  if (!pages.length) throw new Error('No Electron renderer page found.');
  return pages[0];
}

async function setupPage(page, opts = {}) {
  await page.waitForLoadState('domcontentloaded');
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.evaluate(() => {
    localStorage.setItem('otto.onboarded.v1', '1');
    sessionStorage.setItem('otto.sidebar.pinned', '1');
    sessionStorage.setItem('otto.sidebar.recents', '1');
    sessionStorage.setItem('otto.sidebar.nav.workspace', '0');
  });
  await page.waitForFunction(() => !!window.otto?.runtime?.init && !!window.otto?.threads?.list, null, { timeout: 30000 });
  if (opts.init !== false) await waitReady(page);
}

async function waitReady(page) {
  const current = await page.evaluate(() => window.otto.runtime.status()).catch(() => null);
  if (!(current?.ready === true && current?.transportMode === 'ws' && current?.effectiveTransport === 'websocket local')) {
    await page.evaluate(() => window.otto.runtime.init()).catch(() => null);
  }
  await page.waitForFunction(async () => {
    const status = await window.otto.runtime.status();
    return status?.ready === true && status?.transportMode === 'ws' && status?.effectiveTransport === 'websocket local';
  }, null, { timeout: TIMEOUT });
}

async function readState(page) {
  return page.evaluate(async () => {
    const status = await window.otto.runtime.status();
    const body = document.body?.innerText ?? '';
    return {
      status,
      bodyLen: body.length,
      setupHasRetry: body.includes('Retry') && body.includes('Open Settings'),
      queue: JSON.parse(localStorage.getItem('otto.chat.queue.v3') ?? '[]'),
      activeThreadId: (await window.otto.threads.list()).activeThreadId,
    };
  });
}

async function commandStationAbsent(page) {
  return page.evaluate(() => {
    const body = document.body?.innerText ?? '';
    return !document.querySelector('.commandStation') && !body.includes('COMMAND STATION') && !body.includes('What needs you');
  });
}

async function clearQueue(page) {
  await page.evaluate(() => {
    localStorage.removeItem('otto.chat.queue.v3');
    localStorage.removeItem('otto.chat.queue.v2');
    localStorage.removeItem('otto.chat.queue.v1');
    localStorage.removeItem('otto.chat.inflight.v1');
  });
}

async function createViaNewChat(page, title) {
  const before = await activeThreadId(page);
  await clickNewChat(page);
  await page.waitForFunction((previous) => window.otto.threads.list().then((list) => list.activeThreadId && list.activeThreadId !== previous), before, { timeout: TIMEOUT });
  await waitReady(page);
  const id = await activeThreadId(page);
  await renameActiveThreadViaSidebar(page, id, title);
  return getThread(page, id);
}

async function clickNewChat(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-label="New chat"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  }, null, { timeout: 30000 });
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="New chat"]');
    if (!(button instanceof HTMLButtonElement)) throw new Error('New chat button not found');
    button.click();
  });
}

async function renameActiveThreadViaSidebar(page, threadId, title) {
  const row = page.locator('.sidebarConvWrap.is-active').first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.locator('button.sidebarConv').dblclick();
  const input = row.locator('input.sidebarConv__rename');
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(title);
  await input.press('Enter');
  await waitForThread(page, threadId, (thread) => thread.title === title);
  await page.locator('.sidebarConvWrap', { hasText: title }).first().waitFor({ state: 'visible', timeout: 10000 });
}

async function activeThreadId(page) {
  return page.evaluate(() => window.otto.threads.list().then((list) => list.activeThreadId));
}

async function getThread(page, threadId, includeArchived = false) {
  return page.evaluate(([id, archived]) => window.otto.threads.list(archived).then((list) => list.threads.find((thread) => thread.id === id) ?? null), [threadId, includeArchived]);
}

async function waitForThread(page, threadId, predicate, includeArchived = false) {
  const deadline = Date.now() + TIMEOUT;
  while (Date.now() < deadline) {
    const thread = await getThread(page, threadId, includeArchived);
    if (thread && predicate(thread)) return thread;
    await sleep(300);
  }
  throw new Error(`Timed out waiting for thread ${threadId}`);
}

async function sendViaComposer(page, text) {
  const textarea = page.locator('textarea[aria-label="Message Otto"]').first();
  await textarea.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => {
    const input = document.querySelector('textarea[aria-label="Message Otto"]');
    return input instanceof HTMLTextAreaElement && !input.disabled;
  }, null, { timeout: TIMEOUT });
  await textarea.fill(text);
  await page.getByRole('button', { name: /Send message|Queue message/ }).click();
}

async function waitForAssistantMarker(page, threadId, marker, timeout = TIMEOUT) {
  await page.waitForFunction(([id, expected]) => {
    const raw = localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '[]';
    const messages = JSON.parse(raw);
    return messages.some((message) => message.who === 'otto' && String(message.text ?? '').includes(expected));
  }, [threadId, marker], { timeout });
}

async function assistantTextFor(page, threadId) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '[]';
    const messages = JSON.parse(raw);
    return messages.filter((message) => message.who === 'otto').map((message) => message.text).join('\n');
  }, threadId);
}

async function visibleAndStoredText(page, threadId) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '[]';
    const messages = JSON.parse(raw);
    return {
      visible: document.body.innerText,
      stored: messages.map((message) => `${message.who}: ${message.text}`).join('\n'),
    };
  }, threadId);
}

async function clickConversation(page, title, expectedThreadId) {
  const row = page.locator('.sidebarConvWrap').filter({ hasText: title }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.locator('button.sidebarConv').click();
  await page.waitForFunction((id) => window.otto.threads.list().then((list) => list.activeThreadId === id), expectedThreadId, { timeout: TIMEOUT });
  await waitReady(page);
}

async function clickThreadPin(page, title) {
  const row = page.locator('.sidebarConvWrap').filter({ hasText: title }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.locator('.sidebarConv__pin').click();
}

async function archiveConversationTwoClick(page, title) {
  const row = page.locator('.sidebarConvWrap').filter({ hasText: title }).first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  const button = row.locator('.sidebarConv__archive').first();
  const before = await button.boundingBox();
  const beforeLabel = await button.getAttribute('aria-label');
  await button.click();
  await page.waitForFunction((rowTitle) => {
    const rows = Array.from(document.querySelectorAll('.sidebarConvWrap'));
    const found = rows.find((candidate) => (candidate.textContent ?? '').includes(rowTitle));
    return found?.querySelector('.sidebarConv__archive')?.getAttribute('aria-label') === 'Confirm archive';
  }, title, { timeout: 5000 });
  const armed = await button.boundingBox();
  const armedLabel = await button.getAttribute('aria-label');
  await button.click();
  return { before, armed, beforeLabel, armedLabel };
}

function sameBoxCenter(a, b) {
  if (!a || !b) return false;
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.abs(ax - bx) <= 4 && Math.abs(ay - by) <= 4;
}

async function configureModel(page, handle) {
  await page.evaluate((modelHandle) => window.otto.runtime.configure({ modelHandle }), handle);
  await page.waitForFunction((modelHandle) => window.otto.runtime.status().then((status) => status.ready === true && status.modelHandle === modelHandle), handle, { timeout: TIMEOUT });
}

async function configureModelViaPicker(page, handle) {
  await page.locator('.promptbar__pickers .picker__button').first().click();
  await page.waitForSelector('.picker__menu--model', { timeout: 10000 });
  const option = page.locator('.picker__option').filter({ hasText: handle }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click({ force: true });
  await page.waitForFunction((modelHandle) => window.otto.runtime.status().then((status) => status.ready === true && status.modelHandle === modelHandle), handle, { timeout: TIMEOUT });
  await page.waitForFunction(() => {
    const input = document.querySelector('textarea[aria-label="Message Otto"]');
    return input instanceof HTMLTextAreaElement && !input.disabled;
  }, null, { timeout: TIMEOUT });
}

async function proveQueueAndSteer(page, proof, threadId) {
  const longPrompt = [
    `Begin a long answer with token ${marker('LONG')}.`,
    'Write 30 short numbered lines.',
    'If the operator sends another instruction while you are answering, treat it as the next queued operator instruction.',
  ].join(' ');
  await sendViaComposer(page, longPrompt);
  await page.waitForSelector('.chat__thinking', { timeout: 15000 });

  await sendViaComposer(page, `Steer now: stop the long answer and reply with exactly ${proof.markers.steer}.`);
  await page.waitForTimeout(150);
  await sendViaComposer(page, `Then reply with exactly ${proof.markers.queue1}.`);
  await page.waitForTimeout(150);
  await sendViaComposer(page, `Then reply with exactly ${proof.markers.queue2}.`);

  await waitForAssistantMarker(page, threadId, proof.markers.steer, TIMEOUT);
  await waitForAssistantMarker(page, threadId, proof.markers.queue1, TIMEOUT);
  await waitForAssistantMarker(page, threadId, proof.markers.queue2, TIMEOUT);

  const state = await page.evaluate((id) => {
    const queue = JSON.parse(localStorage.getItem('otto.chat.queue.v3') ?? '[]');
    const messages = JSON.parse(localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '[]');
    return {
      queue,
      assistant: messages.filter((message) => message.who === 'otto').map((message) => message.text).join('\n'),
      failedVisible: document.body.innerText.includes("couldn't send"),
    };
  }, threadId);
  proof.queueState = state;
  proof.checks.queueDrain =
    state.queue.filter((item) => item.threadId === threadId && item.state !== 'failed').length === 0 &&
    state.assistant.includes(proof.markers.queue1) &&
    state.assistant.includes(proof.markers.queue2);
  proof.checks.steerChangedCourse = state.assistant.includes(proof.markers.steer);
  proof.checks.queueFailureHonest = !state.queue.some((item) => item.state === 'sending') && !state.failedVisible;
}

async function proveWorkspaceSoon(page) {
  const result = { ok: false, items: {} };
  const workspace = page.getByRole('button', { name: /^Workspace$/ });
  await workspace.waitFor({ state: 'visible', timeout: 10000 });
  if ((await workspace.getAttribute('aria-expanded')) !== 'true') {
    await workspace.click();
  }

  for (const [id, label] of WORKSPACE_SURFACES) {
    const button = page.locator(`button[aria-label="${label}"]`).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    const navSoon = await button.locator('.nav__badge--soon').count().then((count) => count > 0);
    await button.click();
    const shell = page.locator(`.comingSoonShell[data-surface="${id}"]`).first();
    await shell.waitFor({ state: 'visible', timeout: 10000 });
    const text = await shell.innerText();
    result.items[id] = {
      label,
      navSoon,
      surfaceComingSoon: /coming soon/i.test(text),
      textSample: text.replace(/\s+/g, ' ').slice(0, 180),
    };
  }
  result.ok = Object.values(result.items).every((item) => item.navSoon && item.surfaceComingSoon);
  return result;
}

function relaunchStaging() {
  spawnSync('pkill', ['-f', `${STAGING_APP}/Contents/MacOS/otto`], { stdio: 'ignore' });
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const result = spawnSync('pgrep', ['-f', `${STAGING_APP}/Contents/MacOS/otto`], { stdio: 'ignore' });
    if (result.status !== 0) break;
    spawnSync('sleep', ['0.2'], { stdio: 'ignore' });
  }
  execFileSync('/usr/bin/open', ['-n', STAGING_APP, '--args', `--user-data-dir=${PROFILE_DIR}`, `--remote-debugging-port=${CDP_PORT}`]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
