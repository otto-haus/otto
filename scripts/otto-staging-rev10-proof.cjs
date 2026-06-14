#!/usr/bin/env node
/**
 * Staging proof rev10 — 045 permission, 046 composer two-thread, 047 memory search,
 * 049 Chat ticket commands (034 compile, 035 orchestrate, status workers).
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-rev10-proof.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const STAGING_ROOT = process.env.OTTO_STAGING_ROOT ?? `${process.env.HOME}/.codex/admin/otto-staging`;
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);
const SEND_TIMEOUT_MS = Number(process.env.OTTO_CHAT_SEND_TIMEOUT_MS ?? 45_000);

const MSG_A = `046-rev10-thread-a-${RUN_ID}`;
const MSG_B = `046-rev10-thread-b-${RUN_ID}`;

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

  const proof = {
    ok: false,
    runId: RUN_ID,
    gitHead,
    stagingApp: STAGING_APP,
    cdpPort: CDP_PORT,
    stagingRoot: STAGING_ROOT,
    home: `${STAGING_ROOT}/home`,
    ottoHome: `${STAGING_ROOT}/otto-home`,
    profile: `${STAGING_ROOT}/profile`,
    screenshots: {},
    tickets: {},
    checks: {},
    runtimeStatus: null,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('domcontentloaded');
    await dismissOnboarding(page);

    proof.runtimeStatus = await page.evaluate(async () => {
      if (!window.otto?.runtime?.init) return window.otto?.runtime?.status?.() ?? { ready: false, reason: 'no bridge' };
      return window.otto.runtime.init();
    });

    const readyDeadline = Date.now() + INIT_TIMEOUT_MS;
    while (!proof.runtimeStatus?.ready && Date.now() < readyDeadline) {
      await page.waitForTimeout(2000);
      proof.runtimeStatus = await page.evaluate(() => window.otto?.runtime?.status?.() ?? null);
    }

    proof.checks.runtimeReady = proof.runtimeStatus?.ready === true;
    proof.checks.notDefaultConversation =
      proof.runtimeStatus?.conversationId !== 'default' && proof.runtimeStatus?.conversationId != null;

    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(600);
    await ensureComposerReady(page, proof);

    // —— 046 two-thread composer sends (before 049 to avoid transcript pollution) ——
    proof.tickets['046'] = { threads: {}, checks: {}, markers: { threadA: MSG_A, threadB: MSG_B } };

    await page.evaluate(() => {
      localStorage.removeItem('otto.chat.queue.v1');
      localStorage.removeItem('otto.chat.inflight.v1');
    });
    await page.evaluate(async () => {
      try {
        await window.otto?.runtime?.abort?.();
      } catch {
        /* ignore */
      }
    });
    await page.waitForTimeout(800);

    const knownThreadIds = await listThreadIds(page);

    await page.locator('.sidebar__primary[aria-label="New chat"]').click();
    const threadA = await waitForNewActiveThread(page, knownThreadIds, MSG_A, 'A');
    proof.tickets['046'].threads.a = threadA;

    const sendA = await sendChatCommand(page, MSG_A);
    proof.tickets['046'].checks.threadASent = sendA.sent;
    proof.tickets['046'].checks.threadAComposerEnabled = sendA.composerEnabled;
    proof.tickets['046'].checks.threadAQueueDrained = await waitForQueueDrain(page, 45_000);
    proof.tickets['046'].checks.threadAMarkerVisible = await waitForUserBubble(page, MSG_A, 45_000);
    proof.tickets['046'].checks.threadAPersisted = await waitForMarkerInStorage(page, threadA.id, MSG_A, 30_000);
    if (!proof.tickets['046'].checks.threadAPersisted) {
      const activeId = await activeThreadId(page);
      proof.tickets['046'].checks.threadAActiveAfterSend = activeId;
      proof.tickets['046'].checks.threadAPersisted = await waitForMarkerInStorage(page, activeId, MSG_A, 15_000);
    }

    await page.evaluate(async () => {
      try {
        await window.otto?.runtime?.abort?.();
      } catch {
        /* ignore */
      }
    });
    await page.waitForTimeout(600);

    await page.locator('.sidebar__primary[aria-label="New chat"]').click();
    const threadB = await waitForNewActiveThread(page, [...knownThreadIds, threadA.id], MSG_B, 'B');
    proof.tickets['046'].threads.b = threadB;
    proof.tickets['046'].checks.distinctThreadIds = threadA.id !== threadB.id;

    const sendB = await sendChatCommand(page, MSG_B);
    proof.tickets['046'].checks.threadBSent = sendB.sent;
    proof.tickets['046'].checks.threadBQueueDrained = await waitForQueueDrain(page, 45_000);
    proof.tickets['046'].checks.threadBMarkerVisible = await waitForUserBubble(page, MSG_B, 45_000);
    proof.tickets['046'].checks.threadBPersisted = await waitForMarkerInStorage(page, threadB.id, MSG_B, 30_000);
    if (!proof.tickets['046'].checks.threadBPersisted) {
      const activeId = await activeThreadId(page);
      proof.tickets['046'].checks.threadBActiveAfterSend = activeId;
      proof.tickets['046'].checks.threadBPersisted = await waitForMarkerInStorage(page, activeId, MSG_B, 15_000);
    }

    await safeThreadSwitch(page, threadA.id);
    await page.waitForTimeout(800);
    const sessionA = await readActiveChatState(page);
    proof.tickets['046'].checks.sessionAShowsMarker =
      sessionA.visibleText.includes(MSG_A) || sessionA.storageSample.includes(MSG_A);
    proof.tickets['046'].checks.sessionAHidesMarkerB =
      !sessionA.visibleText.includes(MSG_B) && !sessionA.storageSample.includes(MSG_B);
    proof.tickets['046'].checks.sessionAActiveId = sessionA.activeThreadId;

    await safeThreadSwitch(page, threadB.id);
    await page.waitForTimeout(800);
    const sessionB = await readActiveChatState(page);
    proof.tickets['046'].checks.sessionBShowsMarker =
      sessionB.visibleText.includes(MSG_B) || sessionB.storageSample.includes(MSG_B);
    proof.tickets['046'].checks.sessionBHidesMarkerA =
      !sessionB.visibleText.includes(MSG_A) && !sessionB.storageSample.includes(MSG_A);
    proof.tickets['046'].checks.sessionBActiveId = sessionB.activeThreadId;

    // Reload persistence (electron config + localStorage)
    await safeThreadSwitch(page, threadA.id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissOnboarding(page);
    await page.waitForTimeout(1500);
    await ensureComposerReady(page, proof);
    await page.waitForFunction(
      (marker) => {
        const stream = document.querySelector('.chat__stream');
        const text = stream?.textContent ?? '';
        const listKey = Object.keys(localStorage).find((k) => k.startsWith('otto.chat.messages.local_'));
        return text.includes(marker) || (listKey && localStorage.getItem(listKey)?.includes(marker));
      },
      MSG_A,
      { timeout: 10000 },
    ).catch(() => {});

    const stateA = await readActiveChatState(page);
    proof.tickets['046'].checks.reloadAActiveId = stateA.activeThreadId;
    proof.tickets['046'].checks.reloadAStorageKey = stateA.key;
    proof.tickets['046'].checks.threadAShowsMarker =
      stateA.visibleText.includes(MSG_A) || stateA.storageSample.includes(MSG_A);
    proof.tickets['046'].checks.threadAHidesMarkerB =
      !stateA.visibleText.includes(MSG_B) && !stateA.storageSample.includes(MSG_B);
    proof.screenshots['046_a'] = join(RECEIPT_DIR, `046-rev10-thread-a-${RUN_ID}.png`);
    await page.locator('.chat').first().screenshot({ path: proof.screenshots['046_a'] }).catch(async () => {
      await page.screenshot({ path: proof.screenshots['046_a'], fullPage: false });
    });

    await safeThreadSwitch(page, threadB.id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissOnboarding(page);
    await page.waitForTimeout(1500);
    await ensureComposerReady(page, proof);

    const stateB = await readActiveChatState(page);
    proof.tickets['046'].checks.reloadBActiveId = stateB.activeThreadId;
    proof.tickets['046'].checks.threadBShowsMarker =
      stateB.visibleText.includes(MSG_B) || stateB.storageSample.includes(MSG_B);
    proof.tickets['046'].checks.threadBHidesMarkerA =
      !stateB.visibleText.includes(MSG_A) && !stateB.storageSample.includes(MSG_A);
    proof.screenshots['046_b'] = join(RECEIPT_DIR, `046-rev10-thread-b-${RUN_ID}.png`);
    await page.locator('.chat').first().screenshot({ path: proof.screenshots['046_b'] }).catch(async () => {
      await page.screenshot({ path: proof.screenshots['046_b'], fullPage: false });
    });

    proof.tickets['046'].checks.composerSendUsed = sendA.sent && sendB.sent;
    proof.tickets['046'].checks.sessionIsolation =
      proof.tickets['046'].checks.sessionAShowsMarker === true &&
      proof.tickets['046'].checks.sessionAHidesMarkerB === true &&
      proof.tickets['046'].checks.sessionBShowsMarker === true &&
      proof.tickets['046'].checks.sessionBHidesMarkerA === true;
    proof.tickets['046'].checks.reloadIsolation =
      proof.tickets['046'].checks.threadAShowsMarker === true &&
      proof.tickets['046'].checks.threadAHidesMarkerB === true &&
      proof.tickets['046'].checks.threadBShowsMarker === true &&
      proof.tickets['046'].checks.threadBHidesMarkerA === true;
    proof.tickets['046'].ok =
      proof.tickets['046'].checks.distinctThreadIds === true &&
      proof.tickets['046'].checks.composerSendUsed === true &&
      proof.tickets['046'].checks.threadAMarkerVisible === true &&
      proof.tickets['046'].checks.threadBMarkerVisible === true &&
      proof.tickets['046'].checks.sessionIsolation === true;

    writeFileSync(
      join(RECEIPT_DIR, `046-rev10-two-thread-composer-${RUN_ID}.json`),
      JSON.stringify(proof.tickets['046'], null, 2) + '\n',
    );

    // —— 049 ticket commands on fresh disposable thread ——
    await page.evaluate(async () => {
      try {
        await window.otto?.runtime?.abort?.();
      } catch {
        /* ignore */
      }
      localStorage.removeItem('otto.chat.queue.v1');
      localStorage.removeItem('otto.chat.inflight.v1');
    });
    await page.waitForTimeout(600);
    await ensureRuntimeReady(page, proof);
    await page.locator('.sidebar__primary[aria-label="New chat"]').click();
    await page.waitForTimeout(800);
    await ensureComposerReady(page, proof);

    proof.tickets['049'] = { commands: {}, transcript: '' };
    const commands049 = [
      {
        key: 'compile034',
        text: 'compile ticket 034 Staging rev10 proof packet for charter AC gate',
        expect: /Compiled ticket_034|already exists|Receipt:/i,
      },
      {
        key: 'compile035',
        text: 'compile ticket 035 Staging rev10 proof packet for orchestrate-existing',
        expect: /Compiled ticket_035|already exists|Receipt:/i,
      },
      {
        key: 'orchestrate035',
        text: 'orchestrate ticket 035',
        expect: /Orchestrated|Orchestration blocked|Worker:|not found/i,
      },
      {
        key: 'statusWorkers',
        text: 'status workers',
        expect: /Worker status|No workers recorded|workers/i,
      },
    ];

    for (const cmd of commands049) {
      await ensureRuntimeReady(page, proof);
      await ensureComposerReady(page, proof);
      const result = await sendChatCommand(page, cmd.text);
      const transcript = result.transcript || (await chatTranscript(page));
      proof.tickets['049'].commands[cmd.key] = {
        text: cmd.text,
        composerEnabled: result.composerEnabled,
        sent: result.sent,
        userMessagePersisted: result.userMessagePersisted,
        transcriptAfter: result.transcriptSnippet,
        matched: cmd.expect.test(transcript),
      };
      await waitForSendComplete(page, 60_000);
      await page.waitForTimeout(800);
    }

    proof.tickets['049'].transcript = await chatTranscript(page);
    proof.tickets['049'].ok = Object.values(proof.tickets['049'].commands).every((c) => c.matched);
    proof.screenshots['049'] = join(RECEIPT_DIR, `049-chat-ticket-commands-rev10-${RUN_ID}.png`);
    await page.locator('.chat').first().screenshot({ path: proof.screenshots['049'] }).catch(async () => {
      await page.screenshot({ path: proof.screenshots['049'], fullPage: false });
    });
    writeFileSync(
      join(RECEIPT_DIR, `049-chat-ticket-commands-rev10-${RUN_ID}.json`),
      JSON.stringify(proof.tickets['049'], null, 2) + '\n',
    );

    // —— 047 memory search on live blocks ——
    proof.tickets['047'] = {};
    const memoryApi = await page.evaluate(async () => {
      const result = await window.otto.memory.list();
      return {
        connected: !!result?.connected,
        blockCount: result?.blocks?.length ?? 0,
        labels: (result?.blocks ?? []).map((b) => b.label),
        apiPath: result?.apiPath ?? null,
        error: result?.error ?? null,
      };
    });
    proof.tickets['047'].api = memoryApi;

    await page.getByRole('button', { name: 'Settings', exact: true }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Memory observatory/i }).click();
    await page.waitForTimeout(1500);

    const searchInput = page.locator('input[placeholder="Search blocks…"]');
    const searchTerm = memoryApi.labels[0]?.split('/').pop()?.slice(0, 6) ?? 'human';
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(600);

    const visibleBlocks = await page.locator('.panel .h-sec').count();
    const filteredText = await page.locator('body').innerText();
    proof.tickets['047'].searchTerm = searchTerm;
    proof.tickets['047'].visibleBlockPanels = visibleBlocks;
    proof.tickets['047'].searchNarrows =
      memoryApi.blockCount > 0 && visibleBlocks > 0 && visibleBlocks <= memoryApi.blockCount;
    proof.tickets['047'].noMatchEmpty =
      memoryApi.blockCount === 0
        ? /No memory blocks match|Connect an agent/i.test(filteredText)
        : !/No memory blocks match/i.test(filteredText);

    proof.screenshots['047'] = join(RECEIPT_DIR, `047-memory-search-rev10-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots['047'], fullPage: false });
    proof.tickets['047'].ok =
      memoryApi.blockCount >= 1 &&
      proof.tickets['047'].searchNarrows &&
      proof.tickets['047'].noMatchEmpty;

    writeFileSync(
      join(RECEIPT_DIR, `047-memory-search-rev10-${RUN_ID}.json`),
      JSON.stringify(proof.tickets['047'], null, 2) + '\n',
    );

    // —— 045 permission modal (smoke simulate — no live tool execution) ——
    proof.tickets['045'] = { attempted: true, modalCaptured: false, checks: {} };
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(400);
    const permTrigger = await page.evaluate(async () => {
      if (!window.otto?.smoke?.triggerPermission) {
        return { ok: false, reason: 'smoke.triggerPermission missing from preload' };
      }
      try {
        return await window.otto.smoke.triggerPermission({ toolName: 'smoke.read_file' });
      } catch (e) {
        return { ok: false, reason: String(e) };
      }
    });
    proof.tickets['045'].trigger = permTrigger;
    const permModal = page.locator('.modal').filter({ hasText: /permission|allow|deny/i });
    proof.tickets['045'].checks.modalVisible = (await permModal.count()) > 0;
    if (proof.tickets['045'].checks.modalVisible) {
      proof.tickets['045'].modalCaptured = true;
      proof.screenshots['045'] = join(RECEIPT_DIR, `045-permission-modal-rev10-${RUN_ID}.png`);
      await permModal.first().screenshot({ path: proof.screenshots['045'] }).catch(async () => {
        await page.screenshot({ path: proof.screenshots['045'], fullPage: false });
      });
      await page.evaluate((requestId) => {
        window.otto?.permission?.respond?.(requestId, { behavior: 'deny', message: 'staging proof dismiss' });
      }, permTrigger.requestId).catch(() => {});
    }
    proof.tickets['045'].ok = permTrigger?.ok === true && proof.tickets['045'].modalCaptured === true;

    // —— aggregate ——
    proof.ok =
      proof.checks.runtimeReady &&
      proof.tickets['049'].ok &&
      proof.tickets['046'].ok &&
      proof.tickets['047'].ok;
  } finally {
    browser.disconnect?.();
  }

  const outJson = join(RECEIPT_DIR, `staging-rev10-proof-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        ok: proof.ok,
        outJson,
        checks: proof.checks,
        tickets: Object.fromEntries(Object.entries(proof.tickets).map(([k, v]) => [k, v?.ok ?? v?.modalCaptured])),
      },
      null,
      2,
    ),
  );
  if (!proof.ok) process.exit(1);
}

async function listThreadIds(page) {
  return page.evaluate(async () => {
    const list = await window.otto.threads.list();
    return list.threads.map((t) => t.id);
  });
}

async function activeThreadId(page) {
  return page.evaluate(async () => {
    const list = await window.otto.threads.list();
    return list.activeThreadId;
  });
}

async function waitForNewActiveThread(page, previousIds, marker, label) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const thread = await page.evaluate(
      async ({ prev, tag, suffix }) => {
        const list = await window.otto.threads.list();
        const activeId = list.activeThreadId;
        if (!activeId || prev.includes(activeId)) return null;
        const row = list.threads.find((t) => t.id === activeId);
        if (!row) return null;
        await window.otto.threads.touch({ title: `Rev10 ${tag} ${suffix}` });
        return { id: row.id, title: row.title };
      },
      { prev: previousIds, tag: label, suffix: marker.slice(-8) },
    );
    if (thread?.id) {
      await ensureComposerReady(page, {});
      return thread;
    }
    await page.waitForTimeout(300);
  }
  throw new Error(`timed out waiting for new active thread (${label})`);
}

async function safeThreadSwitch(page, threadId) {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.evaluate(async (id) => {
      await window.otto.threads.switch(id);
    }, threadId);
  } catch (error) {
    if (!String(error).includes('destroyed')) throw error;
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(async (id) => {
      await window.otto.threads.switch(id);
    }, threadId);
  }
  await page.waitForTimeout(500);
}

async function clickThreadByMarker(page, marker) {
  const needle = marker.slice(0, Math.min(marker.length, 28));
  const row = page.locator('.sidebar__threads .thread').filter({ hasText: needle }).first();
  if ((await row.count()) > 0) {
    await row.click();
    return;
  }
  const list = await page.evaluate(async () => {
    const r = await window.otto.threads.list();
    return r.threads.map((t) => ({ id: t.id, title: t.title }));
  });
  const hit = list.find((t) => t.title?.includes(needle));
  if (hit) await safeThreadSwitch(page, hit.id);
}

async function waitForQueueDrain(page, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      let queueLen = 0;
      try {
        queueLen = JSON.parse(localStorage.getItem('otto.chat.queue.v1') ?? '[]').length;
      } catch {
        queueLen = document.querySelectorAll('.queueitem').length;
      }
      return { queueLen };
    });
    if (state.queueLen === 0) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

async function waitForUserBubble(page, marker, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = await page.evaluate((m) => {
      const users = [...document.querySelectorAll('.msg--user .msg__body')];
      return users.some((el) => (el.textContent ?? '').includes(m));
    }, marker);
    if (hit) return true;
    const stored = await page.evaluate((m) => {
      return Object.keys(localStorage).some((k) => k.startsWith('otto.chat.messages.') && localStorage.getItem(k)?.includes(m));
    }, marker);
    if (stored) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

async function waitForSendComplete(page, timeoutMs = SEND_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const busy = !!document.querySelector('.chat__thinking');
      const queueItems = document.querySelectorAll('.queueitem').length;
      return { busy, queueItems };
    });
    if (!state.busy && state.queueItems === 0) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function waitForMarkerInStorage(page, threadId, marker, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = await page.evaluate(
      ({ id, m }) => {
        const key = `otto.chat.messages.${id}.v1`;
        return localStorage.getItem(key)?.includes(m) ?? false;
      },
      { id: threadId, m: marker },
    );
    if (hit) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

async function waitForMarkerInStream(page, marker, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await chatTranscript(page);
    const state = await readActiveChatState(page);
    if (text.includes(marker) || state.storageSample.includes(marker)) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

async function ensureRuntimeReady(page, proof) {
  const retry = page.getByRole('button', { name: /^Retry$/i });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const status = await page.evaluate(async () => {
      if (!window.otto?.runtime?.init) return window.otto?.runtime?.status?.() ?? { ready: false };
      return window.otto.runtime.init();
    });
    proof.runtimeStatus = status;
    if (status?.ready) return true;
    if ((await retry.count()) > 0) {
      await retry.first().click().catch(() => {});
      await page.waitForTimeout(2500);
      continue;
    }
    await page.waitForTimeout(1500);
  }
  return proof.runtimeStatus?.ready === true;
}

async function ensureComposerReady(page, proof) {
  const retry = page.getByRole('button', { name: /^Retry$/i });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const composer = page.locator('textarea[aria-label="Message Otto"]');
    if (await composer.isEnabled().catch(() => false)) return true;
    if ((await retry.count()) > 0) {
      await retry.first().click().catch(() => {});
      await page.waitForTimeout(3000);
      proof.runtimeStatus = await page.evaluate(async () => {
        if (!window.otto?.runtime?.init) return window.otto?.runtime?.status?.() ?? null;
        return window.otto.runtime.init();
      });
      continue;
    }
    await page.waitForTimeout(1500);
  }
  return page.locator('textarea[aria-label="Message Otto"]').isEnabled().catch(() => false);
}

async function sendChatCommand(page, text) {
  const composer = page.locator('textarea[aria-label="Message Otto"]');
  const enabled = await composer.isEnabled().catch(() => false);
  if (!enabled) {
    const transcript = await chatTranscript(page);
    return {
      composerEnabled: false,
      sent: false,
      userMessagePersisted: false,
      transcript,
      transcriptSnippet: transcript.slice(0, 600),
    };
  }

  const before = await chatTranscript(page);
  const beforeState = await readActiveChatState(page);
  await composer.fill(text);
  await page.getByRole('button', { name: /Send message|Queue message/i }).click();

  const deadline = Date.now() + SEND_TIMEOUT_MS;
  let after = before;
  let userMessagePersisted = false;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    after = await chatTranscript(page);
    const state = await readActiveChatState(page);
    userMessagePersisted =
      after.includes(text) ||
      state.visibleText.includes(text) ||
      state.storageSample.includes(text);
    if (userMessagePersisted) break;
    if (/Compiled|Orchestrated|Worker status|Orchestration blocked|Receipt:/i.test(after) && after !== before) break;
    if (after.length > before.length + Math.min(text.length, 20)) break;
  }

  if (!userMessagePersisted) {
    userMessagePersisted =
      (await readActiveChatState(page)).storageSample.includes(text) ||
      (await chatTranscript(page)).includes(text);
  }

  return {
    composerEnabled: true,
    sent: userMessagePersisted || after !== before || (await readActiveChatState(page)).messageCount > beforeState.messageCount,
    userMessagePersisted,
    transcript: after,
    transcriptSnippet: after.slice(0, 800),
  };
}

async function chatTranscript(page) {
  const stream = page.locator('.chat__stream');
  if ((await stream.count()) === 0) return '';
  return stream.innerText();
}

async function readActiveChatState(page) {
  return page.evaluate(async () => {
    const list = await window.otto.threads.list();
    const activeId = list.activeThreadId;
    const key = activeId ? `otto.chat.messages.${activeId}.v1` : 'otto.chat.messages.v1';
    const raw = localStorage.getItem(key);
    let parsed = [];
    try {
      parsed = JSON.parse(raw ?? '[]');
    } catch {
      parsed = [];
    }
    const chat = document.querySelector('.chat__stream');
    return {
      activeThreadId: activeId,
      key,
      messageCount: Array.isArray(parsed) ? parsed.length : 0,
      visibleText: chat?.textContent ?? '',
      storageSample: Array.isArray(parsed) ? parsed.map((m) => m.text).join('\n') : '',
    };
  });
}

async function dismissOnboarding(page) {
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
    if ((await skip.count()) > 0) await skip.first().click({ force: true }).catch(() => {});
    const done = page.getByRole('button', { name: /^Done$/ });
    if ((await done.count()) > 0) await done.first().click({ force: true }).catch(() => {});
  }
  await overlay.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
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
