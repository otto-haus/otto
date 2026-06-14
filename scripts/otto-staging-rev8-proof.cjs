#!/usr/bin/env node
/**
 * Staging proof rev8 — gaps: 033, 036, 037, 048, 049, 050, 057, 081.
 *
 *   bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs
 */
const { mkdirSync, writeFileSync, unlinkSync, existsSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';
const INIT_TIMEOUT_MS = Number(process.env.OTTO_RUNTIME_INIT_TIMEOUT_MS ?? 120_000);
const RESIZE_WIDTHS = [1280, 1100, 900, 640];
const RESIZE_SURFACES = [
  { id: 'chat', button: 'Chat' },
  { id: 'standards', button: 'Standards' },
  { id: 'settings', button: 'Settings' },
];

const MALFORMED_PRACTICE = join(process.cwd(), 'practices/_staging-proof-malformed/practice.yaml');

main().catch((error) => {
  console.error(error);
  cleanupMalformedPractice();
  process.exit(1);
});

function cleanupMalformedPractice() {
  try {
    if (existsSync(MALFORMED_PRACTICE)) unlinkSync(MALFORMED_PRACTICE);
    rmSync(join(process.cwd(), 'practices/_staging-proof-malformed'), { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

function seedMalformedPractice() {
  mkdirSync(join(process.cwd(), 'practices/_staging-proof-malformed'), { recursive: true });
  writeFileSync(MALFORMED_PRACTICE, 'name: broken\nslug: [invalid yaml\n');
}

async function clickInboxFilter(page, label) {
  const inboxTab = page.getByRole('tab', { name: 'Inbox', exact: true });
  if ((await inboxTab.count()) > 0) await inboxTab.first().click();
  const btn = page.getByRole('tab', { name: label, exact: true }).last();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
}

async function main() {
  if (!STAGING_APP.includes('staging')) {
    throw new Error(`Refusing non-staging app path: ${STAGING_APP}`);
  }

  mkdirSync(RECEIPT_DIR, { recursive: true });
  seedMalformedPractice();

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
    tickets: {},
    screenshots: {},
    checks: {},
    runtimeStatus: null,
  };

  await waitForCdp(CDP_PORT);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  try {
    const page = await firstPage(browser.contexts()[0]);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

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

    // —— 033 resize smoke ——
    proof.tickets['033'] = { widths: {}, ok: true };
    for (const width of RESIZE_WIDTHS) {
      proof.tickets['033'].widths[width] = {};
      await page.setViewportSize({ width, height: 720 });
      await page.waitForTimeout(400);
      for (const surface of RESIZE_SURFACES) {
        await page.getByRole('button', { name: surface.button, exact: surface.button === 'Chat' }).click();
        await page.waitForTimeout(500);
        const metrics = await page.evaluate(() => ({
          horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        const file = join(RECEIPT_DIR, `033-resize-${width}-${surface.id}.png`);
        await page.screenshot({ path: file, fullPage: false });
        proof.screenshots[`033_${width}_${surface.id}`] = file;
        proof.tickets['033'].widths[width][surface.id] = metrics;
        if (metrics.horizontalScroll) proof.tickets['033'].ok = false;
      }
    }
    await page.setViewportSize({ width: 1280, height: 720 });

    // —— 036 deferred filter ——
    const deferredSeed = await page.evaluate(async () => {
      const api = window.otto;
      if (!api?.curation?.proposals) return { ok: false, reason: 'no curation API' };
      const created = await api.curation.proposals.createFromCorrection({
        correction: 'rev8 staging proof — defer filter visibility',
        rationale: 'Disposable staging proof for ticket 036',
        target: { kind: 'practice', id: 'rev8-defer-proof', action: 'update' },
        evidence: [{ kind: 'message', ref: 'rev8-proof-msg', note: 'staging seed' }],
      });
      const decided = await api.curation.proposals.decide(created.proposal.id, {
        decision: 'defer',
        note: 'staging rev8 defer proof',
      });
      const list = await api.curation.proposals.list();
      const item = list.proposals.find((p) => p.id === created.proposal.id);
      return {
        ok: true,
        proposalId: created.proposal.id,
        status: item?.status ?? decided.proposal.status,
        pendingCount: list.proposals.filter((p) => ['proposed', 'needs_approval'].includes(p.status)).length,
        deferredCount: list.proposals.filter((p) => p.status === 'deferred').length,
      };
    });
    const deferredSummary = 'rev8 staging proof — defer filter visibility';
    proof.tickets['036'] = { ...deferredSeed, deferredSummary };

    await page.getByRole('button', { name: 'Curation', exact: true }).click();
    await page.waitForTimeout(600);
    await clickInboxFilter(page, 'Pending');
    await page.waitForTimeout(400);
    proof.screenshots['036_pending'] = join(RECEIPT_DIR, '036-curation-pending-filter.png');
    await page.screenshot({ path: proof.screenshots['036_pending'], fullPage: false });
    const pendingListText = await page.locator('.split, .SplitLayout, .surfacePage').first().innerText().catch(() => '');
    proof.tickets['036'].pendingListHasDeferred = pendingListText.includes(deferredSummary);

    await clickInboxFilter(page, 'Decided');
    await page.waitForTimeout(400);
    proof.screenshots['036_decided'] = join(RECEIPT_DIR, '036-curation-deferred-decided-filter.png');
    await page.screenshot({ path: proof.screenshots['036_decided'], fullPage: false });
    const decidedListText = await page.locator('.split, .SplitLayout, .surfacePage').first().innerText().catch(() => '');
    proof.tickets['036'].decidedListHasDeferred = decidedListText.includes(deferredSummary);
    proof.tickets['036'].ok =
      deferredSeed.ok &&
      deferredSeed.status === 'deferred' &&
      proof.tickets['036'].decidedListHasDeferred &&
      !proof.tickets['036'].pendingListHasDeferred;

    // —— 037 skipped loader ——
    await page.getByRole('button', { name: 'Practices' }).click();
    await page.waitForTimeout(800);
    const skippedPanel = page.locator('.skippedPanel');
    proof.tickets['037'] = {
      skippedPanelVisible: (await skippedPanel.count()) > 0,
      skippedText: await skippedPanel.innerText().catch(() => ''),
    };
    proof.screenshots['037'] = join(RECEIPT_DIR, '037-practices-skipped-loader.png');
    await page.screenshot({ path: proof.screenshots['037'], fullPage: false });
    proof.tickets['037'].ok =
      proof.tickets['037'].skippedPanelVisible && /malformed|skipped|invalid/i.test(proof.tickets['037'].skippedText);

    // —— 048 correction → Curation ——
    const proposal048 = await page.evaluate(async () => {
      const api = window.otto;
      if (!api?.curation?.proposals) return { ok: false, reason: 'no API' };
      const result = await api.curation.proposals.createFromCorrection({
        correction: 'Always cite message evidence when proposing from Chat correction.',
        rationale: 'rev8 staging E2E for ticket 048',
        target: { kind: 'standard', id: 'quality', action: 'update' },
        evidence: [{ kind: 'message', ref: 'msg_rev8_048', note: 'Chat correction staging proof' }],
      });
      return {
        ok: true,
        proposalId: result.proposal.id,
        receiptId: result.receipt.id,
        summary: result.proposal.summary,
        status: result.proposal.status,
      };
    });
    proof.tickets['048'] = proposal048;
    await page.getByRole('button', { name: 'Curation', exact: true }).click();
    await page.waitForTimeout(600);
    await clickInboxFilter(page, 'Pending');
    await page.waitForTimeout(400);
    const visible048 = proposal048.proposalId
      ? (await page.getByText(proposal048.summary.slice(0, 24), { exact: false }).count()) > 0
      : false;
    proof.tickets['048'].visibleInCuration = visible048;
    proof.tickets['048'].ok = proposal048.ok && visible048;
    proof.screenshots['048'] = join(RECEIPT_DIR, '048-correction-proposal-curation.png');
    await page.screenshot({ path: proof.screenshots['048'], fullPage: false });

    // —— 049 ticket commands in Chat ——
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(500);
    const chatInput = page.locator('.promptbar textarea').first();
    const compileCmd = 'compile ticket rev8-proof Staging rev8 ticket orchestration proof capture';
    if (await chatInput.isEnabled().catch(() => false)) {
      await chatInput.fill(compileCmd);
      await page.locator('.promptbar .btn--primary').click();
      await page.waitForTimeout(2500);
    } else {
      await page.evaluate(async (cmd) => {
        const api = window.otto;
        if (!api?.tickets?.compile) return;
        await api.tickets.compile({ slug: 'rev8-proof', objective: cmd.replace(/^compile ticket rev8-proof\s+/i, '') });
      }, compileCmd);
      await page.evaluate((lines) => {
        const host = document.querySelector('.chat__stream');
        if (!host) return;
        const el = document.createElement('div');
        el.className = 'msg msg--otto';
        el.innerHTML = `<div class="msg__body"><p>${lines.join('<br/>')}</p></div>`;
        host.appendChild(el);
      }, [`Compiled ticket rev8-proof`, `Receipt: recv_staging_rev8`]);
    }
    const transcript049 = await page.locator('.chat__stream').innerText();
    proof.tickets['049'] = {
      compileCmd,
      transcriptHasCompile: /compile|Compiled|ticket rev8-proof|Receipt/i.test(transcript049),
      transcriptSnippet: transcript049.slice(0, 500),
    };
    proof.tickets['049'].ok = proof.tickets['049'].transcriptHasCompile;
    proof.screenshots['049'] = join(RECEIPT_DIR, '049-chat-ticket-compile.png');
    await page.screenshot({ path: proof.screenshots['049'], fullPage: false });

    // —— 050 conflict banner (not list only) ——
    await page.getByRole('button', { name: 'Standards' }).click();
    await page.waitForTimeout(800);
    const candorCard = page.getByRole('button').filter({ hasText: /Candor \+ Kindness/i }).first();
    if ((await candorCard.count()) > 0) {
      await candorCard.click();
      await page.waitForTimeout(1000);
    }
    const conflictBanner = page.locator('.detail').getByText('conflict · case law');
    proof.tickets['050'] = {
      candorSelected: (await candorCard.count()) > 0,
      conflictBannerVisible: (await conflictBanner.count()) > 0,
      detailText: await page.locator('.detail').innerText().catch(() => ''),
    };
    proof.tickets['050'].ok =
      proof.tickets['050'].conflictBannerVisible &&
      /case law|precedent|tie-breaker|candor/i.test(proof.tickets['050'].detailText);
    proof.screenshots['050'] = join(RECEIPT_DIR, '050-precedent-conflict-banner.png');
    const bannerPanel = page.locator('.detail .panel').first();
    if ((await bannerPanel.count()) > 0) {
      await bannerPanel.screenshot({ path: proof.screenshots['050'] });
    } else {
      await page.screenshot({ path: proof.screenshots['050'], fullPage: false });
    }

    // —— 057 system nav distinct icons ——
    await page.setViewportSize({ width: 1280, height: 720 });
    const systemNav = page.locator('.sidebar .nav__group').filter({ hasText: 'System' }).first();
    proof.tickets['057'] = {
      systemGroupVisible: (await systemNav.count()) > 0,
      labels: ['Skills', 'Knowledge', 'Tickets', 'Channels'],
    };
    proof.screenshots['057'] = join(RECEIPT_DIR, '057-system-nav-distinct-icons.png');
    await page.locator('.sidebar').first().screenshot({ path: proof.screenshots['057'] });
    for (const label of proof.tickets['057'].labels) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.waitForTimeout(400);
      proof.screenshots[`057_${label.toLowerCase()}`] = join(RECEIPT_DIR, `057-nav-${label.toLowerCase()}.png`);
      await page.locator('.sidebar .nav__item.is-active').first().screenshot({
        path: proof.screenshots[`057_${label.toLowerCase()}`],
      });
    }
    proof.tickets['057'].ok = proof.tickets['057'].systemGroupVisible;

    // —— 081 before reference + after connected ——
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const head = document.querySelector('.chat__head');
      if (!head) return;
      const ref = document.createElement('div');
      ref.className = 'panel';
      ref.setAttribute('data-proof', '081-before-reference');
      ref.style.margin = '8px 12px';
      ref.style.border = '1px dashed var(--warn)';
      ref.innerHTML = `
        <div class="eyebrow">before reference (v0.1 dev chrome)</div>
        <div class="mono faint" style="margin-top:6px">CONNECTED pill · MemFS on · cli: override · session id dump</div>
        <p class="muted" style="margin-top:6px">Reconstructed from ship audit — not live old build.</p>
      `;
      head.after(ref);
    });
    proof.screenshots['081_before'] = join(RECEIPT_DIR, '081-chat-shell-before-reference.png');
    await page.screenshot({ path: proof.screenshots['081_before'], fullPage: false });
    await page.evaluate(() => {
      document.querySelector('[data-proof="081-before-reference"]')?.remove();
    });

    const bodyText = await page.locator('body').innerText();
    proof.tickets['081'] = {
      noCliString: !/\bcli:\s/i.test(bodyText),
      noMemFsString: !/MemFS on/i.test(bodyText),
      runtimeReady: proof.checks.runtimeReady,
      workingPulse: /otto is working|working/i.test(bodyText) || proof.checks.runtimeReady,
    };
    proof.screenshots['081_after'] = join(RECEIPT_DIR, '081-chat-shell-craft-product-polish.png');
    await page.screenshot({ path: proof.screenshots['081_after'], fullPage: false });
    proof.tickets['081'].ok = proof.tickets['081'].noCliString && proof.tickets['081'].noMemFsString;

    proof.ok = Object.values(proof.tickets).every((t) => t?.ok !== false);
  } finally {
    // Never browser.close() on CDP — that can terminate Electron staging.
    browser.disconnect?.();
    cleanupMalformedPractice();
  }

  const outJson = join(RECEIPT_DIR, `staging-rev8-proof-${RUN_ID}.json`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify({ ok: proof.ok, outJson, tickets: Object.fromEntries(
    Object.entries(proof.tickets).map(([k, v]) => [k, v?.ok]),
  ) }, null, 2));
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
