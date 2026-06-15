#!/usr/bin/env node
/**
 * Staging hygiene proof — tickets 054–058, 049, 053 surface smoke on otto-staging.app.
 *
 *   OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh
 *   NODE_PATH=$HOME/.codex/admin/node_modules \
 *     OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
 *     OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
 *     node scripts/otto-staging-hygiene-proof.cjs
 */
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RECEIPT_DIR = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts/staging');
const CDP_PORT = Number(process.env.OTTO_STAGING_PORT ?? 9445);
const RUN_ID = process.env.OTTO_STAGING_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const STAGING_APP = process.env.OTTO_STAGING_APP ?? '/Applications/otto-staging.app';

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
    tickets: {},
    screenshots: {},
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
      if (!window.otto?.runtime?.init) return window.otto?.runtime?.status?.() ?? { ready: false };
      return window.otto.runtime.init();
    });

    await page.evaluate(async () => {
      if (!window.otto?.labs?.set) return;
      await window.otto.labs.set({
        enabled: true,
        features: {
          knowledge_cognee: true,
          channels_outbound: true,
        },
      });
    });
    await page.waitForTimeout(600);

    proof.tickets['054'] = {
      stagingApp: STAGING_APP,
      gitHead,
      runtimeReady: proof.runtimeStatus?.ready === true,
      ok: proof.runtimeStatus?.ready === true,
    };

    // —— 055 Knowledge ——
    await openSurface(page, 'Knowledge');
    await page.waitForTimeout(900);
    const knowledgeText = await page.locator('.split, .surfacePage, .pane').first().innerText().catch(() => '');
    const knowledgeApi = await page.evaluate(async () => {
      if (!window.otto?.knowledge?.list) return { ok: false, reason: 'knowledge.list missing' };
      const list = await window.otto.knowledge.list();
      return {
        ok: (list.models?.length ?? 0) > 0 || (list.registry?.status ?? '').length > 0,
        modelCount: list.models?.length ?? 0,
        registryStatus: list.registry?.status ?? null,
      };
    });
    proof.tickets['055'] = {
      paneLoaded: knowledgeText.length > 20,
      hasRegistryOrEmpty: /model|registry|routing|proposed|empty|skipped|labs/i.test(knowledgeText),
      api: knowledgeApi,
      snippet: knowledgeText.slice(0, 400),
      ok: knowledgeApi.ok || /model|registry|routing|proposed/i.test(knowledgeText),
    };
    proof.screenshots['055'] = join(RECEIPT_DIR, `055-knowledge-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots['055'], fullPage: false });

    // —— 056 Skills / Tickets / Channels ——
    for (const [key, label] of [
      ['skills', 'Skills'],
      ['tickets', 'Tickets'],
      ['channels', 'Channels'],
    ]) {
      await openSurface(page, label);
      await page.waitForTimeout(800);
      const text = await page.locator('.split, .surfacePage, .pane').first().innerText().catch(() => '');
      proof.tickets['056'] = proof.tickets['056'] ?? { surfaces: {} };
      proof.tickets['056'].surfaces[key] = {
        loaded: text.length > 10,
        snippet: text.slice(0, 300),
      };
      proof.screenshots[`056_${key}`] = join(RECEIPT_DIR, `056-${key}-${RUN_ID}.png`);
      await page.screenshot({ path: proof.screenshots[`056_${key}`], fullPage: false });
    }
    proof.tickets['056'].ok = Object.values(proof.tickets['056'].surfaces).every((s) => s.loaded);

    // —— 058 Settings status / transport ——
    await openSurface(page, 'Settings');
    await page.waitForTimeout(700);
    const settingsText = await page.locator('body').innerText();
    proof.tickets['058'] = {
      settingsLoaded: /General|Providers|Memory/i.test(settingsText),
      transportOrStatusVisible: /transport:|ready|connected|disconnected|reason/i.test(settingsText),
      ok: /General|Providers/i.test(settingsText),
    };
    proof.screenshots['058'] = join(RECEIPT_DIR, `058-settings-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots['058'], fullPage: false });

    // —— 053 Practices Run (charter + field-note) ——
    await openSurface(page, 'Practices');
    await page.waitForTimeout(800);
    const practiceRun = await page.evaluate(async () => {
      if (!window.otto?.practices?.run) return { ok: false, reason: 'practices.run missing' };
      const runPractice = async (input) => {
        const result = await window.otto.practices.run(input);
        return {
          ok: true,
          receiptId: result.receipt?.id,
          runId: result.run?.id,
          slug: result.practice?.slug,
          artifactPath: result.artifactPath ?? null,
        };
      };
      try {
        const charter = await runPractice({ slug: 'charter' });
        const fieldNote = await runPractice({
          slug: 'field-note',
          payload: {
            raw_note: 'Staging hygiene proof: operator asked for receipt before wire.',
            source: { who: 'hygiene smoke', role: 'agent', where: 'staging', when: new Date().toISOString() },
          },
        });
        return {
          ok: charter.ok && fieldNote.ok,
          charter,
          fieldNote,
          receiptId: charter.receiptId,
          runId: charter.runId,
          slug: charter.slug,
        };
      } catch (e) {
        return { ok: false, reason: String(e) };
      }
    });
    proof.tickets['053'] = {
      ...practiceRun,
      paneVisible: (await page.getByText(/charter|review|field note/i).count()) > 0,
    };
    proof.tickets['053'].ok =
      practiceRun.ok &&
      !!practiceRun.receiptId &&
      !!practiceRun.fieldNote?.receiptId &&
      !!practiceRun.fieldNote?.artifactPath;
    proof.screenshots['053'] = join(RECEIPT_DIR, `053-practices-charter-${RUN_ID}.png`);
    await page.screenshot({ path: proof.screenshots['053'], fullPage: false });

    // —— 049 Chat orchestrate via API when composer busy ——
    await openSurface(page, 'Chat');
    await page.waitForTimeout(500);
    const chat049 = await page.evaluate(async () => {
      const compile = async (slug, objective) => {
        const existing = await window.otto.tickets.get(`ticket_${slug}`);
        if (existing) return { skipped: true, ticketId: existing.ticket_id };
        return window.otto.tickets.compile({ slug, objective: objective ?? `Hygiene proof ${slug}` });
      };
      await compile('034', 'Hygiene staging proof for ticket 034');
      await compile('035', 'Hygiene staging proof for orchestrate-existing');
      const ticket = await window.otto.tickets.get('ticket_035');
      if (!ticket) return { ok: false, reason: 'ticket_035 missing after compile' };

      const gate = await window.otto.autonomy.evaluateAction({
        action: 'orchestrate ticket_035',
        context: 'hygiene-proof',
      });
      let orchestrate = null;
      let orchestrateError = null;
      if (gate.evaluation.allowed_without_approval) {
        try {
          orchestrate = await window.otto.tickets.orchestrateExisting('ticket_035');
        } catch (e) {
          orchestrateError = String(e);
        }
      }
      const workers = await window.otto.workers.list();
      const workerFor035 = workers.workers.find((w) => w.ticket_id === 'ticket_035');
      return {
        gateAllowed: gate.evaluation.allowed_without_approval,
        gateZone: gate.evaluation.zone,
        gateReceipt: gate.receipt?.id,
        orchestrated: !!orchestrate,
        orchestrateError,
        workerId: orchestrate?.worker?.id ?? workerFor035?.id,
        workerCount: workers.workers.length,
        ok:
          !!ticket &&
          (!!orchestrate?.worker?.id ||
            !!workerFor035 ||
            /already exists for ticket_035/i.test(orchestrateError ?? '')),
      };
    });
    proof.tickets['049'] = chat049;
    proof.screenshots['049'] = join(RECEIPT_DIR, `049-orchestrate-${RUN_ID}.png`);
    await page.locator('.chat').first().screenshot({ path: proof.screenshots['049'] }).catch(async () => {
      await page.screenshot({ path: proof.screenshots['049'], fullPage: false });
    });

    proof.ok =
      proof.tickets['054']?.ok &&
      proof.tickets['055']?.ok &&
      proof.tickets['056']?.ok &&
      proof.tickets['058']?.ok &&
      proof.tickets['053']?.ok &&
      proof.tickets['049']?.ok;
  } finally {
    await browser.close().catch(() => {});
  }

  const outJson = join(RECEIPT_DIR, `staging-hygiene-proof-${RUN_ID}.json`);
  const outMd = join(RECEIPT_DIR, `hygiene-staging-proof-${RUN_ID}.md`);
  writeFileSync(outJson, JSON.stringify(proof, null, 2) + '\n');
  writeFileSync(
    outMd,
    `# Staging hygiene proof (${RUN_ID})

- **Branch:** \`${gitHead}\`
- **App:** \`${STAGING_APP}\`
- **Runtime ready:** ${proof.tickets['054']?.runtimeReady ?? false}

| Ticket | OK | Notes |
|--------|-----|-------|
| 054 | ${proof.tickets['054']?.ok ? 'pass' : 'fail'} | staging deploy + runtime |
| 055 | ${proof.tickets['055']?.ok ? 'pass' : 'fail'} | Knowledge pane |
| 056 | ${proof.tickets['056']?.ok ? 'pass' : 'fail'} | Skills/Tickets/Channels |
| 058 | ${proof.tickets['058']?.ok ? 'pass' : 'fail'} | Settings status |
| 053 | ${proof.tickets['053']?.ok ? 'pass' : 'fail'} | Practices charter + field-note run |
| 049 | ${proof.tickets['049']?.ok ? 'pass' : 'fail'} | orchestrate ticket_035 |

JSON: \`staging-hygiene-proof-${RUN_ID}.json\`
`,
  );
  console.log(JSON.stringify({ ok: proof.ok, outJson, outMd, tickets: proof.tickets }, null, 2));
  if (!proof.ok) process.exit(1);
}

async function dismissOnboarding(page) {
  for (let i = 0; i < 6; i += 1) {
    const skip = page.getByRole('button', { name: /Skip|Continue|Got it|Finish|Start|Next/i });
    if ((await skip.count()) === 0) break;
    await skip.first().click().catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function openSurface(page, label) {
  const collapsed = await page.locator('.sidebar.is-collapsed').count();
  if (collapsed > 0) {
    await page.locator('.sidebar__toggle').click().catch(() => {});
    await page.waitForTimeout(400);
  }
  const workspaceHead = page.locator('.navGroup__head').filter({ hasText: 'Workspace' }).first();
  if ((await workspaceHead.count()) > 0) {
    const expanded = await workspaceHead.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await workspaceHead.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  const byLabel = page.locator(`button[aria-label="${label}"]`).first();
  if ((await byLabel.count()) > 0) {
    await byLabel.click();
    await page.waitForTimeout(800);
    return;
  }
  const byTip = page.locator(`button[data-tip="${label}"]`).first();
  if ((await byTip.count()) > 0) {
    await byTip.click();
    await page.waitForTimeout(800);
    return;
  }
  await page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 15000 });
  await page.waitForTimeout(800);
}

async function waitForCdp(port, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
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
