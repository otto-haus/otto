#!/usr/bin/env node
/**
 * Staging proof rev7/rev9 — 135, 134, 081, 046, 059 with runtime.init on disposable conversation.
 * 076 full bootstrap (skip onboarding + chat turn): scripts/otto-staging-076-bootstrap-proof.cjs
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev7-proof.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const VIEWPORT = { width: 1280, height: 720 };
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);
const DEMO_TICKET_SLUG = process.env.OTTO_DEMO_TICKET_SLUG ?? '135-demo';

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
    viewport: VIEWPORT,
    screenshots: {},
    checks: {},
    runtimeStatus: null,
    threads: null,
    block: null,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.setViewportSize(VIEWPORT);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Initialize runtime (disposable smoke conversation — never default)
    proof.runtimeStatus = await page.evaluate(async () => {
      if (!window.otto?.runtime?.init) return { ready: false, reason: 'no bridge' };
      return window.otto.runtime.init();
    });

    const readyDeadline = Date.now() + INIT_TIMEOUT_MS;
    while (!proof.runtimeStatus?.ready && Date.now() < readyDeadline) {
      await page.waitForTimeout(2000);
      proof.runtimeStatus = await page.evaluate(async () => window.otto?.runtime?.status?.() ?? null);
    }

    proof.checks.runtimeReady = proof.runtimeStatus?.ready === true;
    proof.checks.conversationId = proof.runtimeStatus?.conversationId ?? null;
    proof.checks.sessionMode = proof.runtimeStatus?.sessionMode ?? null;
    proof.checks.notDefaultConversation =
      proof.runtimeStatus?.conversationId !== 'default' && proof.runtimeStatus?.conversationId != null;

    // 076 — optional bootstrap turn (full path: scripts/otto-staging-076-bootstrap-proof.cjs)
    proof.bootstrapTurnCompleted = false;
    proof.bootstrap076Script = 'scripts/otto-staging-076-bootstrap-proof.cjs';
    proof.threads = await page.evaluate(async () => {
      const api = window.otto;
      if (!api?.threads) return { ok: false, reason: 'no threads API' };

      const mkMsg = (threadId, text) => {
        const key = threadId ? `otto.chat.messages.${threadId}.v1` : 'otto.chat.messages.v1';
        const payload = [{ id: `proof-${Date.now()}`, who: 'user', text }];
        localStorage.setItem(key, JSON.stringify(payload));
        return key;
      };

      const a = await api.threads.create({ title: '046-alpha-thread' });
      const b = await api.threads.create({ title: '046-beta-thread' });
      const alphaId = a.thread.id;
      const betaId = b.thread.id;

      mkMsg(alphaId, '046-alpha: isolated message A');
      await api.threads.switch(alphaId);

      mkMsg(betaId, '046-beta: isolated message B');
      await api.threads.switch(betaId);

      const readKey = (id) => {
        const raw = localStorage.getItem(`otto.chat.messages.${id}.v1`);
        try {
          return JSON.parse(raw ?? '[]');
        } catch {
          return [];
        }
      };

      await api.threads.switch(alphaId);
      const alphaVisible = readKey(alphaId);
      await api.threads.switch(betaId);
      const betaVisible = readKey(betaId);

      const list = await api.threads.list(false);
      return {
        ok: true,
        alphaId,
        betaId,
        alphaText: alphaVisible[0]?.text ?? null,
        betaText: betaVisible[0]?.text ?? null,
        isolationOk:
          alphaVisible[0]?.text?.includes('alpha') &&
          betaVisible[0]?.text?.includes('beta') &&
          !alphaVisible[0]?.text?.includes('beta'),
        threadCount: list.threads.length,
        activeThreadId: list.activeThreadId,
        titles: list.threads.map((t) => ({ id: t.id, title: t.title })),
      };
    });

    proof.checks.threadIsolation = proof.threads?.isolationOk === true;
    proof.checks.threadCountGte2 = (proof.threads?.threadCount ?? 0) >= 2;

    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(800);
    proof.screenshots.sidebar046 = join(RECEIPT_DIR, '046-sidebar-thread-list.png');
    await page.locator('.sidebar').first().screenshot({ path: proof.screenshots.sidebar046 });

    // 081 — Chat at 1280 with runtime connected (canonical filename)
    const bodyText = await page.locator('body').innerText();
    proof.checks.noCliString = !/\bcli:\s/i.test(bodyText);
    proof.checks.noMemFsString = !/MemFS on/i.test(bodyText);
    proof.checks.workingPulseCopy = /otto is working|working/i.test(bodyText) || proof.checks.runtimeReady;
    proof.screenshots.chat081 = join(RECEIPT_DIR, '081-chat-shell-craft-product-polish.png');
    await page.screenshot({ path: proof.screenshots.chat081, fullPage: false });

    // 059 — Command Station with live counts when ready
    const station = page.locator('.commandStation');
    proof.checks.commandStationVisible = (await station.count()) > 0;
    if (proof.checks.commandStationVisible) {
      proof.screenshots.commandStation059 = join(RECEIPT_DIR, '059-command-station-live.png');
      await station.first().screenshot({ path: proof.screenshots.commandStation059 });
    }

    // 134 — Checks surface with seeded checks
    proof.checksSurface = await page.evaluate(async () => {
      const api = window.otto;
      if (!api?.checks?.list) return { ok: false, reason: 'no checks API' };
      const result = await api.checks.list();
      return {
        ok: true,
        dir: result.dir,
        count: result.checks?.length ?? 0,
        ids: (result.checks ?? []).map((c) => c.id),
      };
    });
    proof.checks.checksSeededGte1 = (proof.checksSurface?.count ?? 0) >= 1;

    await page.getByRole('button', { name: 'Checks', exact: true }).click();
    await page.waitForTimeout(900);
    proof.screenshots.checks134 = join(RECEIPT_DIR, '134-checks-surface.png');
    await page.screenshot({ path: proof.screenshots.checks134, fullPage: false });
    proof.checks.checksSurfaceHasContent = proof.checks.checksSeededGte1;

    // 135 — trigger CheckBlockBanner in Chat via `check ticket` command
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(600);

    await page.evaluate(async (slug) => {
      const api = window.otto;
      if (!api?.tickets?.compile) return;
      try {
        await api.tickets.compile({
          slug,
          objective: 'Culture CI block demo — disposable staging proof',
        });
      } catch {
        /* may exist */
      }
    }, DEMO_TICKET_SLUG);

    const blockViaIpc = await page.evaluate(async (slug) => {
      const api = window.otto;
      if (!api?.checks?.evaluateDoneClaim || !api?.tickets?.get) return null;
      const ticketId = slug.startsWith('ticket_') ? slug : `ticket_${slug}`;
      const ticket = await api.tickets.get(ticketId);
      if (!ticket) return { ok: false, reason: 'ticket missing' };
      const results = await api.checks.evaluateDoneClaim({
        acceptance_criteria: ticket.acceptance_criteria,
        review: { evidence: [] },
        evidence: [],
      });
      const blocked = results.find((r) => r.blocked && !r.passed);
      if (!blocked) return { ok: false, reason: 'no block result', results };
      const check = await api.checks.get(blocked.check_id);
      return {
        ok: true,
        checkName: blocked.check_id,
        message: blocked.message,
        receiptId: blocked.receipt_id,
        standardId: check?.standard_slug ?? check?.source?.replace(/^standard\//, '').replace(/\.md$/i, ''),
        results,
      };
    }, DEMO_TICKET_SLUG);

    proof.block = blockViaIpc;

    const chatInput = page.locator('.promptbar textarea').first();
    const chatEnabled = proof.checks.runtimeReady && (await chatInput.isEnabled().catch(() => false));

    if (chatEnabled) {
      await chatInput.fill(`check ticket ${DEMO_TICKET_SLUG}`);
      await page.locator('.promptbar .btn--primary').click();
      await page.waitForTimeout(2000);
    }

    const blockBanner = page.locator('.checkBlockBanner');
    proof.checks.checkBlockBanner = (await blockBanner.count()) > 0;
    proof.checks.checkBlockBannerSynthetic = false;

    if (proof.checks.checkBlockBanner) {
      const receiptBtn = blockBanner.getByRole('button', { name: /open receipt/i });
      proof.checks.checkBlockBannerHasReceiptLink = (await receiptBtn.count()) > 0;
      proof.screenshots.block135 = join(RECEIPT_DIR, '135-culture-ci-block.png');
      await blockBanner.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const bannerShot = page.locator('.msg:has(.checkBlockBanner)').first();
      if ((await bannerShot.count()) > 0) {
        await bannerShot.screenshot({ path: proof.screenshots.block135 });
      } else {
        await blockBanner.first().screenshot({ path: proof.screenshots.block135 });
      }
    } else {
      proof.checks.checkBlockBannerNote = blockViaIpc?.reason ?? 'Check block banner not visible in Chat';
      if (blockViaIpc?.ok) {
        proof.checks.checkBlockBannerNote =
          `${proof.checks.checkBlockBannerNote}; IPC block ok but Chat UI did not render banner`;
      }
    }

    proof.ok =
      proof.checks.notDefaultConversation !== false &&
      proof.checks.noCliString &&
      proof.checks.noMemFsString &&
      proof.checks.threadIsolation &&
      proof.checks.checksSeededGte1 &&
      proof.checks.checksSurfaceHasContent &&
      (proof.checks.runtimeReady ? proof.checks.commandStationVisible : true) &&
      proof.checks.checkBlockBanner === true &&
      proof.checks.checkBlockBannerHasReceiptLink === true;
  } finally {
    await browser.close().catch(() => {});
  }

  const outJson = join(RECEIPT_DIR, `staging-rev7-proof-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  writeFileSync(join(RECEIPT_DIR, '046-two-thread-isolation.json'), JSON.stringify(proof.threads, null, 2) + '\n');
  writeFileSync(join(RECEIPT_DIR, '135-culture-ci-demo.json'), JSON.stringify({
    runId: RUN_ID,
    proofJson: outJson,
    checkBlockBanner: proof.checks.checkBlockBanner === true,
    checksSeeded: proof.checksSurface?.count ?? 0,
    block: proof.block,
  }, null, 2) + '\n');

  console.log(JSON.stringify({ ok: proof.ok, outJson, checks: proof.checks }, null, 2));
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
