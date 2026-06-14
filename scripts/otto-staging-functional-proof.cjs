#!/usr/bin/env node
/**
 * Broad functional proof for /Applications/otto-staging.app.
 *
 * Preconditions:
 *   OTTO_STAGING_DEBUG_PORT=9445 task staging
 *
 * This intentionally targets staging only. It connects to the running Electron
 * app over CDP, exercises the exposed desktop bridge/UI, and writes a durable
 * JSON receipt under docs/receipts/staging.
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? process.env.OTTO_STAGING_DEBUG_PORT ?? 9445);
const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const TURN_TIMEOUT_MS = Number(process.env.OTTO_FUNCTIONAL_TURN_TIMEOUT_MS ?? 180_000);
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);

const marker = (name) => `OTTO_${name}_${RUN_ID}`;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
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
    runId: RUN_ID,
    gitHead,
    cdpPort: CDP_PORT,
    receiptDir: RECEIPT_DIR,
    markers: {
      threadA: marker('THREAD_A'),
      threadB: marker('THREAD_B'),
      queue: marker('QUEUE_REPEAT'),
      steer: marker('STEER'),
      ws: marker('WS'),
    },
    status: {},
    checks: {},
    details: {},
    screenshots: {},
    consoleMessages: [],
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const context = browser.contexts()[0];
    const page = await firstPage(context);
    page.on('console', (msg) => proof.consoleMessages.push({ type: msg.type(), text: msg.text() }));
    await page.setViewportSize({ width: 1360, height: 860 });
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);
    await waitForBridge(page);
    await installEventRecorder(page);

    const initialStatus = await initRuntime(page);
    proof.status.initial = initialStatus;
    proof.checks.wsTransport = {
      ok:
        initialStatus?.ready === true &&
        initialStatus?.transportMode === 'ws' &&
        String(initialStatus?.effectiveTransport ?? '').includes('websocket') &&
        !initialStatus?.transportFallbackReason,
      ready: initialStatus?.ready === true,
      transportMode: initialStatus?.transportMode ?? null,
      effectiveTransport: initialStatus?.effectiveTransport ?? null,
      fallbackReason: initialStatus?.transportFallbackReason ?? null,
      baseUrl: initialStatus?.baseUrl ?? null,
      sessionMode: initialStatus?.sessionMode ?? null,
    };

    const models = await listModelsWithRetry(page);
    const modelHandles = models.map((m) => m.handle);
    const configuredHandle = initialStatus?.modelHandle ?? null;
    const selectedHandle = modelHandles.includes(configuredHandle)
      ? configuredHandle
      : modelHandles[0] ?? null;
    let configuredStatus = initialStatus;
    if (selectedHandle) {
      configuredStatus = await page.evaluate(async (modelHandle) => window.otto.runtime.configure({ modelHandle }), selectedHandle);
    }
    proof.details.models = { handles: modelHandles, selectedHandle, configuredHandle };
    proof.status.afterModelConfigure = configuredStatus;
    proof.checks.modelSwitch = {
      ok: modelHandles.length > 0 && !!selectedHandle && configuredStatus?.modelHandle === selectedHandle,
      listedRealModels: modelHandles.length,
      selectedHandle,
      configuredModelHandle: configuredStatus?.modelHandle ?? null,
      defaultHandlePresent: configuredHandle ? modelHandles.includes(configuredHandle) : false,
    };

    const threadA = await page.evaluate(async (title) => window.otto.threads.create({ title }), `Functional A ${RUN_ID}`);
    await waitForRuntimeReady(page);
    const statusA = await page.evaluate(async () => window.otto.runtime.status());
    await page.evaluate(async ({ threadId, text }) => {
      localStorage.setItem(`otto.chat.messages.${threadId}.v1`, JSON.stringify([
        { id: `proof-a-${Date.now()}`, who: 'user', text },
      ]));
    }, { threadId: threadA.thread.id, text: proof.markers.threadA });

    const threadB = await page.evaluate(async (title) => window.otto.threads.create({ title }), `Functional B ${RUN_ID}`);
    await waitForRuntimeReady(page);
    const statusB = await page.evaluate(async () => window.otto.runtime.status());
    await page.evaluate(async ({ threadId, text }) => {
      localStorage.setItem(`otto.chat.messages.${threadId}.v1`, JSON.stringify([
        { id: `proof-b-${Date.now()}`, who: 'user', text },
      ]));
    }, { threadId: threadB.thread.id, text: proof.markers.threadB });

    const listedWithTwo = await page.evaluate(async () => window.otto.threads.list(true));
    const indexA = listedWithTwo.threads.findIndex((t) => t.id === threadA.thread.id);
    const indexB = listedWithTwo.threads.findIndex((t) => t.id === threadB.thread.id);
    proof.details.threads = {
      a: { id: threadA.thread.id, conversationId: statusA?.conversationId ?? threadA.thread.lettaConversationId ?? null },
      b: { id: threadB.thread.id, conversationId: statusB?.conversationId ?? threadB.thread.lettaConversationId ?? null },
      indexA,
      indexB,
    };
    proof.checks.multipleConversations = {
      ok:
        threadA.thread.id !== threadB.thread.id &&
        !!statusA?.conversationId &&
        !!statusB?.conversationId &&
        statusA.conversationId !== statusB.conversationId,
      threadA: threadA.thread.id,
      threadB: threadB.thread.id,
      conversationA: statusA?.conversationId ?? null,
      conversationB: statusB?.conversationId ?? null,
    };
    proof.checks.recents = {
      ok: indexB >= 0 && indexA >= 0 && indexB < indexA,
      indexA,
      indexB,
      newestFirstForProofThreads: indexB < indexA,
    };

    const switchA = await switchAndRead(page, threadA.thread.id);
    const switchB = await switchAndRead(page, threadB.thread.id);
    proof.details.switchA = summarizeSwitch(switchA);
    proof.details.switchB = summarizeSwitch(switchB);
    proof.checks.switch = {
      ok:
        switchA.status?.conversationId === statusA?.conversationId &&
        switchB.status?.conversationId === statusB?.conversationId &&
        switchA.visibleText.includes(proof.markers.threadA) &&
        !switchA.visibleText.includes(proof.markers.threadB) &&
        switchB.visibleText.includes(proof.markers.threadB) &&
        !switchB.visibleText.includes(proof.markers.threadA),
      aConversation: switchA.status?.conversationId ?? null,
      bConversation: switchB.status?.conversationId ?? null,
      aShowsOwnMarker: switchA.visibleText.includes(proof.markers.threadA),
      aHidesBMarker: !switchA.visibleText.includes(proof.markers.threadB),
      bShowsOwnMarker: switchB.visibleText.includes(proof.markers.threadB),
      bHidesAMarker: !switchB.visibleText.includes(proof.markers.threadA),
    };

    const pinnedA = await page.evaluate(async (threadId) => window.otto.threads.pin(threadId, true), threadA.thread.id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissOnboarding(page);
    await waitForBridge(page);
    const afterPinReload = await page.evaluate(async (threadId) => {
      const list = await window.otto.threads.list(true);
      return list.threads.find((t) => t.id === threadId) ?? null;
    }, threadA.thread.id);
    proof.checks.pinned = {
      ok: pinnedA?.pinned === true && afterPinReload?.pinned === true && afterPinReload?.archived === false,
      pinnedAfterMutation: pinnedA?.pinned ?? null,
      pinnedAfterReload: afterPinReload?.pinned ?? null,
    };

    const archivedB = await page.evaluate(async (threadId) => window.otto.threads.archive(threadId), threadB.thread.id);
    const listWithoutArchived = await page.evaluate(async () => window.otto.threads.list(false));
    const listWithArchived = await page.evaluate(async () => window.otto.threads.list(true));
    const restoredB = await page.evaluate(async (threadId) => window.otto.threads.restore(threadId), threadB.thread.id);
    const listAfterRestore = await page.evaluate(async () => window.otto.threads.list(false));
    proof.checks.archive = {
      ok:
        archivedB?.archived === true &&
        !listWithoutArchived.threads.some((t) => t.id === threadB.thread.id) &&
        listWithArchived.threads.some((t) => t.id === threadB.thread.id && t.archived === true) &&
        restoredB?.archived === false &&
        listAfterRestore.threads.some((t) => t.id === threadB.thread.id && t.archived === false),
      archivedAfterMutation: archivedB?.archived ?? null,
      hiddenFromRecents: !listWithoutArchived.threads.some((t) => t.id === threadB.thread.id),
      recoverableInArchivedList: listWithArchived.threads.some((t) => t.id === threadB.thread.id && t.archived === true),
      restored: restoredB?.archived === false,
    };

    const queueThread = await page.evaluate(async (title) => window.otto.threads.create({ title }), `Functional Queue ${RUN_ID}`);
    await waitForRuntimeReady(page);
    await page.evaluate(({ threadId, text }) => {
      const now = Date.now();
      localStorage.setItem('otto.chat.queue.v3', JSON.stringify([
        { id: `${threadId}-q1`, text, createdAt: now, state: 'queued', threadId },
        { id: `${threadId}-q2`, text, createdAt: now + 1, state: 'queued', threadId },
      ]));
    }, { threadId: queueThread.thread.id, text: proof.markers.queue });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissOnboarding(page);
    await waitForBridge(page);
    await waitForRuntimeReady(page);
    const queueResult = await waitForQueueDrain(page, queueThread.thread.id, proof.markers.queue, TURN_TIMEOUT_MS * 2);
    proof.details.queue = queueResult;
    proof.checks.queue = {
      ok: queueResult.queueLength === 0 && queueResult.userMessageCount >= 2,
      queueLength: queueResult.queueLength,
      userMessageCount: queueResult.userMessageCount,
      messageTexts: queueResult.messageTexts,
    };

    await installEventRecorder(page);
    const wsEventsBefore = await eventCount(page);
    await page.evaluate(async (prompt) => window.otto.runtime.send(prompt), `Reply with exactly this marker: ${proof.markers.ws}`);
    const wsEvents = await eventsSince(page, wsEventsBefore);
    proof.details.wsSendEvents = wsEvents.slice(-12);
    proof.checks.wsSendReceive = {
      ok: wsEvents.some((event) => event?.message?.type === 'assistant' && typeof event.message.text === 'string'),
      assistantEventCount: wsEvents.filter((event) => event?.message?.type === 'assistant').length,
    };

    const steerEventsBefore = await eventCount(page);
    const steerResult = await page.evaluate(async ({ initialPrompt, steerText, timeoutMs }) => {
      window.__ottoSteerProof = { sendDone: false, sendError: null };
      const sendPromise = window.otto.runtime.send(initialPrompt)
        .then(() => { window.__ottoSteerProof.sendDone = true; })
        .catch((error) => { window.__ottoSteerProof.sendError = error instanceof Error ? error.message : String(error); });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await window.otto.runtime.steer(steerText);
      await Promise.race([
        sendPromise,
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
      return window.__ottoSteerProof;
    }, {
      initialPrompt: `Begin a slow answer. If the next user input changes the task, follow it exactly.`,
      steerText: `Change course now. Reply exactly: ${proof.markers.steer}`,
      timeoutMs: TURN_TIMEOUT_MS,
    });
    const steerEvents = await eventsSince(page, steerEventsBefore);
    const steerText = stringifyEvents(steerEvents);
    proof.details.steer = { result: steerResult, events: steerEvents.slice(-20), textTail: steerText.slice(-2000) };
    proof.checks.steer = {
      ok: steerResult?.sendDone === true && steerText.includes(proof.markers.steer),
      sendDone: steerResult?.sendDone === true,
      sendError: steerResult?.sendError ?? null,
      markerObserved: steerText.includes(proof.markers.steer),
    };

    const finalStatus = await page.evaluate(async () => window.otto.runtime.status());
    proof.status.final = finalStatus;
    proof.checks.noSilentHang = {
      ok:
        finalStatus?.ready === true &&
        (await page.locator('.chat__head').count()) > 0 &&
        (await page.locator('textarea[aria-label="Message Otto"]').count()) > 0,
      ready: finalStatus?.ready === true,
      reason: finalStatus?.reason ?? null,
      headerPresent: (await page.locator('.chat__head').count()) > 0,
      composerPresent: (await page.locator('textarea[aria-label="Message Otto"]').count()) > 0,
    };

    proof.screenshots.final = join(RECEIPT_DIR, `functional-proof-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots.final, fullPage: false });

    proof.ok = Object.values(proof.checks).every((check) => check && check.ok === true);
  } finally {
    await browser.close().catch(() => {});
  }

  const outJson = join(RECEIPT_DIR, `functional-proof-${RUN_ID}.json`);
  writeFileSync(outJson, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks }, null, 2));
  if (!proof.ok) process.exit(1);
}

async function dismissOnboarding(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('otto.onboarded.v1', '1');
      localStorage.removeItem('otto.onboarding.firstMessage.v1');
    } catch {
      /* ignore */
    }
  });
  const skip = page.getByRole('button', { name: /^Skip$/i });
  if (await skip.count()) await skip.first().click().catch(() => {});
}

async function waitForBridge(page) {
  await page.waitForFunction(() => typeof window.otto?.runtime?.status === 'function', null, { timeout: 30_000 });
}

async function installEventRecorder(page) {
  await page.evaluate(() => {
    window.__ottoEvents = [];
    if (typeof window.__ottoUnsub === 'function') window.__ottoUnsub();
    window.__ottoUnsub = window.otto.onEvent((event) => {
      window.__ottoEvents.push({ at: Date.now(), event });
    });
  });
}

async function initRuntime(page) {
  let status = await page.evaluate(async () => window.otto.runtime.status());
  if (!status?.ready) {
    status = await page.evaluate(async () => window.otto.runtime.init());
  }
  const deadline = Date.now() + INIT_TIMEOUT_MS;
  while (!status?.ready && Date.now() < deadline) {
    await page.waitForTimeout(1000);
    status = await page.evaluate(async () => window.otto.runtime.status());
  }
  return status;
}

async function waitForRuntimeReady(page) {
  const deadline = Date.now() + INIT_TIMEOUT_MS;
  let status = await page.evaluate(async () => window.otto.runtime.status());
  while (!status?.ready && Date.now() < deadline) {
    await page.waitForTimeout(1000);
    status = await page.evaluate(async () => window.otto.runtime.status());
  }
  if (!status?.ready) throw new Error(`runtime not ready: ${status?.reason ?? 'unknown'}`);
  return status;
}

async function listModelsWithRetry(page) {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const models = await page.evaluate(async () => window.otto.models.list());
      if (Array.isArray(models) && models.length > 0) return models;
      lastError = new Error('model list returned empty');
    } catch (error) {
      lastError = error;
    }
    await page.waitForTimeout(1000 * (attempt + 1));
  }
  throw lastError ?? new Error('model list failed');
}

async function switchAndRead(page, threadId) {
  const switched = await page.evaluate(async (id) => window.otto.threads.switch(id), threadId);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dismissOnboarding(page);
  await waitForBridge(page);
  await waitForRuntimeReady(page);
  await page.waitForTimeout(500);
  const visibleText = await page.locator('body').innerText();
  const storage = await page.evaluate((id) => localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '', threadId);
  return { status: switched.status, visibleText, storage };
}

function summarizeSwitch(result) {
  return {
    conversationId: result.status?.conversationId ?? null,
    storageTail: String(result.storage ?? '').slice(-500),
    visibleTail: String(result.visibleText ?? '').slice(-1000),
  };
}

async function waitForQueueDrain(page, threadId, text, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(({ threadId: id, text: markerText }) => {
      const queue = JSON.parse(localStorage.getItem('otto.chat.queue.v3') ?? '[]');
      const messages = JSON.parse(localStorage.getItem(`otto.chat.messages.${id}.v1`) ?? '[]');
      const matchingUsers = messages.filter((msg) => msg?.who === 'user' && msg?.text === markerText);
      return {
        queueLength: Array.isArray(queue) ? queue.filter((item) => item?.threadId === id).length : -1,
        userMessageCount: matchingUsers.length,
        messageTexts: matchingUsers.map((msg) => msg.text),
      };
    }, { threadId, text });
    if (last.queueLength === 0 && last.userMessageCount >= 2) return last;
    await page.waitForTimeout(1000);
  }
  return last ?? { queueLength: -1, userMessageCount: 0, messageTexts: [] };
}

async function eventCount(page) {
  return page.evaluate(() => window.__ottoEvents?.length ?? 0);
}

async function eventsSince(page, index) {
  return page.evaluate((start) => (window.__ottoEvents ?? []).slice(start).map((item) => item.event), index);
}

function stringifyEvents(events) {
  return events.map((event) => JSON.stringify(event)).join('\n');
}

async function waitForCdp(port, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`CDP not ready on port ${port}`);
}

async function firstPage(context) {
  for (let i = 0; i < 60; i += 1) {
    const pages = context.pages();
    if (pages.length) return pages[0];
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('No CDP page found');
}
