import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KnowledgeStore } from './knowledge-store';
import { ReceiptWriter } from './receipt-writer';
import { RoutineStore } from './routine-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const routinesDir = join(repoRoot, 'routines');

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

  test('uses directory slug when routine.yaml omits slug', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-fallback-'));
    try {
      const routineDir = join(tmp, 'fallback-routine');
      mkdirSync(routineDir, { recursive: true });
      writeFileSync(
        join(routineDir, 'routine.yaml'),
        [
          'id: routine-fallback',
          'name: Fallback Routine',
          'status: proposed',
          'summary: Uses directory slug.',
          'steps:',
          '  - practice: check',
          '    invocation: /check',
          'created_at: 2026-06-14T00:00:00.000Z',
          '',
        ].join('\n'),
      );
      const result = new RoutineStore(tmp).listResult();
      expect(result.skipped).toEqual([]);
      expect(result.routines[0]?.slug).toBe('fallback-routine');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('manual run writes a receipt with routine reference', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-routine-test-'));
    try {
      const store = new RoutineStore(routinesDir, new ReceiptWriter(tmp));
      const result = store.runManual('morning');

      expect(result.receipt.action).toBe('routine.run.manual');
      expect(result.receipt.routine?.slug).toBe('morning');
      expect(result.receipt.routine?.mode).toBe('manual');
      expect(result.receipt.subject.type).toBe('routine');
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
});
