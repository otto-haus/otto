#!/usr/bin/env bun
/**
 * Issue #124 — Extension CLI parity smoke.
 *
 * Simulates extension command → desktop PracticeRunner (otto:practices:run) →
 * receipt visible via ReceiptStore (otto:receipts:list) under the same OTTO_HOME.
 *
 *   bun scripts/extension-parity-smoke.ts
 *
 * Never uses conversation=default. Uses isolated temp OTTO_HOME only.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const EXTENSION_COMMANDS = [
  { id: 'charter', file: 'extension/charter.ts', defaultInvocation: '/charter step' },
  { id: 'review', file: 'extension/review.ts', defaultInvocation: '/review done' },
  { id: 'field-note', file: 'extension/field-note.ts', defaultInvocation: '/field-note capture' },
  { id: 'routine', file: 'extension/routine.ts', defaultInvocation: '/routine list' },
] as const;

export type ExtensionParitySmokeResult =
  | {
      ok: true;
      ottoHome: string;
      charterReceiptId: string;
      reviewReceiptId: string;
      receiptCount: number;
      receiptPath: string;
    }
  | {
      ok: false;
      check: string;
      message: string;
      nextAction: string;
    };

export function validateExtensionFiles(repoRoot: string): string | null {
  for (const cmd of EXTENSION_COMMANDS) {
    const path = join(repoRoot, cmd.file);
    if (!existsSync(path)) return `Missing extension file: ${cmd.file}`;
    const src = readFileSync(path, 'utf8');
    if (!src.includes(`id: "${cmd.id}"`) && !src.includes(`id: '${cmd.id}'`)) {
      return `${cmd.file} does not register command id "${cmd.id}"`;
    }
  }
  return null;
}

export async function runExtensionParitySmoke(options?: {
  repoRoot?: string;
  receiptDir?: string;
}): Promise<ExtensionParitySmokeResult> {
  const repoRoot = options?.repoRoot ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const fileError = validateExtensionFiles(repoRoot);
  if (fileError) {
    return {
      ok: false,
      check: 'extension files',
      message: fileError,
      nextAction: 'Restore extension/*.ts command registrations or update parity matrix.',
    };
  }

  const ottoHome = mkdtempSync(join(tmpdir(), 'otto-ext-parity-'));
  const priorHome = process.env.OTTO_HOME;
  process.env.OTTO_HOME = ottoHome;

  try {
    const { PracticeRunner } = await import('../apps/desktop/electron/practice-runner.ts');
    const { PracticeStore } = await import('../apps/desktop/electron/practice-store.ts');
    const { ReceiptWriter } = await import('../apps/desktop/electron/receipt-writer.ts');
    const { ReceiptStore } = await import('../apps/desktop/electron/receipt-store.ts');
    const { RunStore } = await import('../apps/desktop/electron/run-store.ts');
    const { PracticeMetricsStore } = await import('../apps/desktop/electron/practice-metrics-store.ts');
    const { AutonomyStore } = await import('../apps/desktop/electron/autonomy-store.ts');

    const practicesDir = join(repoRoot, 'practices');
    const runner = new PracticeRunner(
      new PracticeStore(practicesDir),
      new RunStore(join(ottoHome, 'runs')),
      new ReceiptWriter(join(ottoHome, 'receipts')),
      new PracticeMetricsStore(join(ottoHome, 'metrics')),
      new AutonomyStore(),
    );

    const charter = runner.run({
      slug: 'charter',
      invocation: '/charter step',
      payload: { intent: 'extension-parity-smoke charter' },
    });
    if (charter.receipt.action !== 'practice.charter.run') {
      return {
        ok: false,
        check: 'charter smoke',
        message: `Expected practice.charter.run, got ${charter.receipt.action}`,
        nextAction: 'Align PracticeRunner charter path with extension /charter step.',
      };
    }

    const review = runner.run({
      slug: 'review',
      invocation: '/review done',
      payload: {
        acceptance_criteria: [{ id: 'AC1', text: 'Charter receipt emitted', proof: charter.receipt.id }],
        review: {
          verdict: '+1',
          evidence: [charter.receipt.path],
          reviewed_at: new Date().toISOString(),
        },
        evidence: [charter.receipt.path],
      },
    });
    if (review.receipt.action !== 'practice.review.done') {
      return {
        ok: false,
        check: 'review smoke',
        message: `Expected practice.review.done, got ${review.receipt.action}`,
        nextAction: 'Align PracticeRunner review path with extension /review done.',
      };
    }
    if (review.receipt.status !== 'success') {
      return {
        ok: false,
        check: 'review smoke',
        message: `Review receipt blocked: ${review.receipt.result.summary}`,
        nextAction: 'Map acceptance criteria to proof for /review done parity.',
      };
    }

    const store = new ReceiptStore(join(ottoHome, 'receipts'));
    const listed = store.list();
    const ids = new Set(listed.receipts.map((r) => r.id));
    if (!ids.has(charter.receipt.id) || !ids.has(review.receipt.id)) {
      return {
        ok: false,
        check: 'receipts list',
        message: 'ReceiptStore did not list charter/review receipts from shared OTTO_HOME',
        nextAction: 'Verify ReceiptWriter and ReceiptStore share the same receipts directory.',
      };
    }

    const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const receiptDir = options?.receiptDir ?? join(repoRoot, 'docs/receipts/staging');
    mkdirSync(receiptDir, { recursive: true });
    const receiptPath = join(receiptDir, `124-extension-parity-${runId}.json`);
    const proof = {
      ok: true,
      issue: 124,
      ottoHome,
      charterReceiptId: charter.receipt.id,
      reviewReceiptId: review.receipt.id,
      receiptCount: listed.receipts.length,
      invocations: ['/charter step', '/review done'],
    };
    writeFileSync(receiptPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

    return {
      ok: true,
      ottoHome,
      charterReceiptId: charter.receipt.id,
      reviewReceiptId: review.receipt.id,
      receiptCount: listed.receipts.length,
      receiptPath,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      check: 'runtime',
      message,
      nextAction: 'Fix PracticeRunner import path or desktop electron module load.',
    };
  } finally {
    if (priorHome === undefined) delete process.env.OTTO_HOME;
    else process.env.OTTO_HOME = priorHome;
    rmSync(ottoHome, { recursive: true, force: true });
  }
}

async function main() {
  const result = await runExtensionParitySmoke();
  if (!result.ok) {
    console.error(`FAIL [${result.check}] ${result.message}`);
    console.error(`Next: ${result.nextAction}`);
    process.exit(1);
  }
  console.log('PASS extension parity smoke (charter + review → shared OTTO_HOME receipts)');
  console.log(`  charter receipt: ${result.charterReceiptId}`);
  console.log(`  review receipt:  ${result.reviewReceiptId}`);
  console.log(`  listed count:    ${result.receiptCount}`);
  console.log(`  proof:           ${result.receiptPath}`);
}

if (import.meta.main) {
  main();
}
