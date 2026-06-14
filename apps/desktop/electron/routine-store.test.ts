import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReceiptWriter } from './receipt-writer';
import { RoutineStore } from './routine-store';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const routinesDir = join(repoRoot, 'routines');

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
});
