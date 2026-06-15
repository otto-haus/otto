import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KnowledgeStore } from './knowledge-store';
import { PracticeMetricsStore } from './practice-metrics-store';
import { PracticeRunner } from './practice-runner';
import { PracticeStore } from './practice-store';
import { ReceiptWriter } from './receipt-writer';
import { RunStore } from './run-store';
import { RoutineStore } from './routine-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const routinesDir = join(repoRoot, 'routines');
const practicesDir = join(repoRoot, 'practices');

/** PracticeRunner whose stores all write under `tmp` so routine runs never touch ~/.otto. */
function hermeticRunner(tmp: string): PracticeRunner {
  return new PracticeRunner(
    new PracticeStore(practicesDir),
    new RunStore(join(tmp, 'runs')),
    new ReceiptWriter(join(tmp, 'receipts')),
    new PracticeMetricsStore(join(tmp, 'metrics')),
  );
}

function seedKnowledge(dir: string): void {
  const frontierDir = join(dir, 'ai-frontier');
  mkdirSync(join(dir, '_templates'), { recursive: true });
  mkdirSync(frontierDir, { recursive: true });
  writeFileSync(join(frontierDir, 'capability-notes.md'), '# Capability notes\n');
  writeFileSync(
    join(frontierDir, 'model-registry.yaml'),
    `version: 0.1
status: proposed
last_reviewed: "2026-01-01"
models:
  - provider: openai
    model: test-model
    last_verified: "2026-01-01"
routing:
  status: proposed
  assignments:
    ticket_worker: openai/test-model
`,
  );
}

describe('RoutineStore', () => {
  test('loads Routines from file-backed canon', () => {
    const store = new RoutineStore(routinesDir);
    const result = store.listResult();

    expect(result.storage).toBe('files');
    expect(result.routines.length).toBeGreaterThanOrEqual(3);
    expect(result.skipped).toEqual([]);

    const morning = result.routines.find((routine) => routine.slug === 'morning');
    expect(morning?.requires_approval_to_activate).toBe(true);
    expect(morning?.schedule?.cron).toBeTruthy();
    expect(morning?.steps.length).toBeGreaterThan(0);
  });

  test('blocks recurring activation without approval', () => {
    const store = new RoutineStore(routinesDir);
    const gate = store.activationGate('morning');

    expect(gate.scheduled).toBe(true);
    expect(gate.requiresApproval).toBe(true);
    expect(gate.allowed).toBe(false);
  });

  test('manual run writes a receipt with routine reference', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-test-'));
    try {
      const store = new RoutineStore(routinesDir, new ReceiptWriter(tmp), undefined, hermeticRunner(tmp));
      const result = store.runManual('morning');

      expect(result.receipt.action).toBe('routine.run.manual');
      expect(result.receipt.routine?.slug).toBe('morning');
      expect(result.receipt.routine?.mode).toBe('manual');
      expect(result.receipt.subject.type).toBe('routine');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('manual run actually executes wired practice steps and records per-step receipts (#640)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-exec-'));
    const routines = join(tmp, 'routines');
    const slugDir = join(routines, 'charter-only');
    mkdirSync(slugDir, { recursive: true });
    writeFileSync(
      join(slugDir, 'routine.yaml'),
      `id: routine_charter_only_v0
slug: charter-only
name: Charter Only
status: proposed
summary: A routine whose only step is a runtime-wired charter practice.
steps:
  - practice: charter
    invocation: /charter status
attention_cost: low
requires_approval_to_activate: true
created_at: "2026-06-13T00:00:00Z"
`,
    );
    try {
      const store = new RoutineStore(routines, new ReceiptWriter(join(tmp, 'rec')), undefined, hermeticRunner(tmp));
      const result = store.runManual('charter-only');

      expect(result.receipt.status).toBe('success');
      expect(result.receipt.result.data.stepsRun).toBe(1);
      expect(result.stepResults?.[0].status).toBe('success');
      // The step was really executed: it carries a practice-run receipt id.
      expect(result.stepResults?.[0].receiptId).toBeTruthy();
      expect(result.receipt.evidence.some((e) => e.ref === result.stepResults?.[0].receiptId)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('NEGATIVE: routine with un-runnable steps does NOT record success (#640)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-neg-'));
    const routines = join(tmp, 'routines');
    const slugDir = join(routines, 'decision-only');
    mkdirSync(slugDir, { recursive: true });
    writeFileSync(
      join(slugDir, 'routine.yaml'),
      `id: routine_decision_only_v0
slug: decision-only
name: Decision Only
status: proposed
summary: A routine whose only step is a practice not wired for runtime.
steps:
  - practice: decision
    invocation: /decision frame
attention_cost: low
requires_approval_to_activate: true
created_at: "2026-06-13T00:00:00Z"
`,
    );
    try {
      const store = new RoutineStore(routines, new ReceiptWriter(join(tmp, 'rec')), undefined, hermeticRunner(tmp));
      const result = store.runManual('decision-only');

      // Un-run steps must never be reported as success.
      expect(result.receipt.status).toBe('blocked');
      expect(result.receipt.result.data.stepsRun).toBe(0);
      expect(result.receipt.result.data.stepsSkipped).toBe(1);
      expect(result.receipt.blocker?.code).toBe('routine_steps_incomplete');
      expect(result.receipt.blocker?.recoverable).toBe(true);
      expect(result.stepResults?.[0].status).toBe('skipped');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('morning routine reports honest partial execution (charter runs, decision/follow-up cannot)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-morning-'));
    try {
      const store = new RoutineStore(routinesDir, new ReceiptWriter(join(tmp, 'rec')), undefined, hermeticRunner(tmp));
      const result = store.runManual('morning');

      // morning declares charter + review + decision + follow-up; not all are runnable.
      expect(result.receipt.status).toBe('blocked');
      expect(result.receipt.result.data.stepsSkipped).toBeGreaterThanOrEqual(1);
      expect(result.stepResults?.some((s) => s.practice === 'decision' && s.status === 'skipped')).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('ai-frontier-review manual run delegates to frontier executor', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-test-'));
    try {
      const knowledgeDir = join(tmp, 'knowledge');
      seedKnowledge(knowledgeDir);
      const store = new RoutineStore(routinesDir, new ReceiptWriter(tmp), new KnowledgeStore(knowledgeDir));
      const result = store.runManual('ai-frontier-review');

      expect(result.receipt.action).toBe('routine.run.manual');
      expect(result.knowledgeReceiptId).toBeTruthy();
      expect(result.receipt.result.data.knowledgeReceiptId).toBe(result.knowledgeReceiptId);
      expect(result.receipt.evidence.some((entry) => entry.ref.includes(knowledgeDir))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('practice-mining manual run invokes observe loop without proposal on single receipt', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-test-'));
    process.env.OTTO_HOME = tmp;
    try {
      const receiptsDir = join(tmp, 'receipts');
      mkdirSync(receiptsDir, { recursive: true });
      writeFileSync(
        join(receiptsDir, 'one.json'),
        JSON.stringify({ action: 'ticket.compile', id: 'r1' }),
      );

      const store = new RoutineStore(routinesDir, new ReceiptWriter(receiptsDir));
      const result = store.runManual('practice-mining');

      expect(result.receipt.action).toBe('routine.run.manual');
      expect(result.observeReceiptId).toBeTruthy();
      expect(result.proposalIds).toEqual([]);
      expect(result.receipt.result.data.proposalCount).toBe(0);
      expect(result.receipt.evidence.some((entry) => entry.note === 'practice.mining.observe')).toBe(true);
      expect(result.receipt.evidence.some((entry) => entry.ref === receiptsDir)).toBe(true);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('practice-mining manual run creates Curation proposal on repeated receipts', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-test-'));
    process.env.OTTO_HOME = tmp;
    try {
      const receiptsDir = join(tmp, 'receipts');
      mkdirSync(receiptsDir, { recursive: true });
      for (let i = 0; i < 2; i += 1) {
        writeFileSync(
          join(receiptsDir, `repeat-${i}.json`),
          JSON.stringify({ action: 'otto.test.repeated-mining-action', id: `r${i}` }),
        );
      }

      const store = new RoutineStore(routinesDir, new ReceiptWriter(receiptsDir));
      const result = store.runManual('practice-mining');

      expect(result.observeReceiptId).toBeTruthy();
      expect(result.proposalIds?.length).toBe(1);
      expect(result.receipt.result.data.proposalCount).toBe(1);
      expect(result.receipt.input.proposalIds).toHaveLength(1);
    } finally {
      delete process.env.OTTO_HOME;
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
