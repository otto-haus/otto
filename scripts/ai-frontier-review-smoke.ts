#!/usr/bin/env bun
/**
 * Issue #83 — AI frontier review routine executor integration smoke.
 *
 * Copies bundled `knowledge/` into an isolated temp dir (never mutates repo knowledge/).
 * Proves manual executor + routine delegation + routing proposal path.
 *
 *   task smoke:ai-frontier-review
 *   bun scripts/ai-frontier-review-smoke.ts
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AiFrontierReviewExecutor } from '../apps/desktop/electron/ai-frontier-review-executor';
import { KnowledgeStore } from '../apps/desktop/electron/knowledge-store';
import { ProposalStore } from '../apps/desktop/electron/proposal-store';
import { ReceiptWriter } from '../apps/desktop/electron/receipt-writer';
import { RoutineStore } from '../apps/desktop/electron/routine-store';

const defaultRepoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export type AiFrontierReviewSmokeCheck =
  | 'knowledge_source'
  | 'routine_spec'
  | 'executor_receipt'
  | 'executor_touched'
  | 'registry_update'
  | 'registry_fields'
  | 'routine_receipt'
  | 'routine_link'
  | 'routing_proposal';

export type AiFrontierReviewSmokeFailure = {
  ok: false;
  check: AiFrontierReviewSmokeCheck;
  detail: string;
  nextAction: string;
};

export type AiFrontierReviewSmokeSuccess = {
  ok: true;
  knowledgeSource: string;
  isolatedKnowledgeDir: string;
  executorReceiptAction: string;
  routineKnowledgeReceiptId: string;
  routingProposalId: string;
  touchedCount: number;
};

export type AiFrontierReviewSmokeResult = AiFrontierReviewSmokeFailure | AiFrontierReviewSmokeSuccess;

export function formatAiFrontierReviewSmokeFailure(failure: AiFrontierReviewSmokeFailure): string {
  return `FAIL [${failure.check}] ${failure.detail}\nNext: ${failure.nextAction}`;
}

export function runAiFrontierReviewSmoke(opts: { repoRoot?: string } = {}): AiFrontierReviewSmokeResult {
  const root = opts.repoRoot ?? defaultRepoRoot;
  const knowledgeSource = join(root, 'knowledge');
  const routinesDir = join(root, 'routines');
  const routineSpec = join(routinesDir, 'ai-frontier-review', 'routine.yaml');

  if (!existsSync(knowledgeSource)) {
    return {
      ok: false,
      check: 'knowledge_source',
      detail: `Missing bundled knowledge dir: ${knowledgeSource}`,
      nextAction: 'Ensure repo knowledge/ tree is present.',
    };
  }
  if (!existsSync(routineSpec)) {
    return {
      ok: false,
      check: 'routine_spec',
      detail: `Missing routine spec: ${routineSpec}`,
      nextAction: 'Add routines/ai-frontier-review/routine.yaml.',
    };
  }

  const tmp = mkdtempSync(join(tmpdir(), 'otto-ai-frontier-smoke-'));
  const knowledgeDir = join(tmp, 'knowledge');
  const receiptsDir = join(tmp, 'receipts');
  const proposalsDir = join(tmp, 'curation', 'proposals');

  try {
    cpSync(knowledgeSource, knowledgeDir, { recursive: true });

    const knowledge = new KnowledgeStore(knowledgeDir);
    const receipts = new ReceiptWriter(receiptsDir);
    const proposals = new ProposalStore(proposalsDir);
    const registryPath = join(knowledgeDir, 'ai-frontier', 'model-registry.yaml');

    if (!existsSync(registryPath)) {
      return {
        ok: false,
        check: 'knowledge_source',
        detail: `Copied knowledge missing model-registry.yaml at ${registryPath}`,
        nextAction: 'Seed knowledge/ai-frontier/model-registry.yaml in repo.',
      };
    }

    const beforeRegistry = readFileSync(registryPath, 'utf8');
    const executor = new AiFrontierReviewExecutor(knowledge, receipts, proposals);
    const executorRun = executor.run();

    if (executorRun.receipt.action !== 'knowledge.frontier_review.manual') {
      return {
        ok: false,
        check: 'executor_receipt',
        detail: `Unexpected executor receipt action: ${executorRun.receipt.action}`,
        nextAction: 'Fix AiFrontierReviewExecutor receipt action.',
      };
    }
    if (executorRun.touched.length === 0) {
      return {
        ok: false,
        check: 'executor_touched',
        detail: 'Executor touched no knowledge files',
        nextAction: 'Ensure knowledge tree has capability notes and registry.',
      };
    }

    const afterRegistry = readFileSync(registryPath, 'utf8');
    if (afterRegistry === beforeRegistry) {
      return {
        ok: false,
        check: 'registry_update',
        detail: 'model-registry.yaml unchanged after manual run',
        nextAction: 'Executor should update last_reviewed and last_verified.',
      };
    }
    if (!afterRegistry.includes('last_verified:')) {
      return {
        ok: false,
        check: 'registry_fields',
        detail: 'Registry missing last_verified after manual run',
        nextAction: 'Check executor registry update path.',
      };
    }

    const routineStore = new RoutineStore(routinesDir, receipts, knowledge);
    const routineRun = routineStore.runManual('ai-frontier-review');

    if (routineRun.receipt.action !== 'routine.run.manual') {
      return {
        ok: false,
        check: 'routine_receipt',
        detail: `Unexpected routine receipt action: ${routineRun.receipt.action}`,
        nextAction: 'Fix RoutineStore.runManual for ai-frontier-review.',
      };
    }
    if (!routineRun.knowledgeReceiptId) {
      return {
        ok: false,
        check: 'routine_link',
        detail: 'Routine manual run did not link knowledgeReceiptId',
        nextAction: 'Wire frontier executor receipt into routine receipt.',
      };
    }

    const routingRun = executor.run({
      routingChangeDetected: true,
      routingSummary: 'Integration smoke routing proposal (#83)',
    });
    if (!routingRun.routingProposalId) {
      return {
        ok: false,
        check: 'routing_proposal',
        detail: 'routingChangeDetected did not create a Curation proposal',
        nextAction: 'Routing policy changes must create knowledge proposals, not silent edits.',
      };
    }

    return {
      ok: true,
      knowledgeSource,
      isolatedKnowledgeDir: knowledgeDir,
      executorReceiptAction: executorRun.receipt.action,
      routineKnowledgeReceiptId: routineRun.knowledgeReceiptId,
      routingProposalId: routingRun.routingProposalId,
      touchedCount: executorRun.touched.length,
    };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const runId = process.env.OTTO_AI_FRONTIER_SMOKE_RUN_ID ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const receiptDir = process.env.OTTO_RECEIPT_DIR ?? join(process.cwd(), 'docs/receipts');
  mkdirSync(receiptDir, { recursive: true });

  const result = runAiFrontierReviewSmoke();
  const receiptPath = join(receiptDir, `issue-83-ai-frontier-review-smoke-${runId}.json`);
  writeFileSync(
    receiptPath,
    `${JSON.stringify({ schema: 'otto.ai-frontier-review-smoke.v1', issue: 83, runId, ...result }, null, 2)}\n`,
  );

  if (!result.ok) {
    console.error(formatAiFrontierReviewSmokeFailure(result));
    console.error(`Receipt: ${receiptPath}`);
    process.exit(1);
  }

  console.log('PASS: AI frontier review integration smoke');
  console.log(`  knowledge_source=${result.knowledgeSource}`);
  console.log(`  executor_action=${result.executorReceiptAction}`);
  console.log(`  routine_knowledge_receipt=${result.routineKnowledgeReceiptId}`);
  console.log(`  routing_proposal=${result.routingProposalId}`);
  console.log(`  touched_count=${result.touchedCount}`);
  console.log(`Receipt: ${receiptPath}`);
}

if (import.meta.main) {
  main();
}
