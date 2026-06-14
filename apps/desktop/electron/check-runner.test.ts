import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckRunner } from './check-runner';
import { CheckStore } from './check-store';

describe('CheckRunner', () => {
  test('blocks done_claim without evidence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-run-'));
    try {
      process.env.OTTO_CHECKS_DIR = dir;
      const store = new CheckStore(dir);
      store.listResult();
      const runner = new CheckRunner(store);
      const results = runner.evaluateDoneClaim({
        acceptance_criteria: [{ id: 'AC1', text: 'Ship feature', proof: '' }],
        review: { verdict: '+1', evidence: [] },
      });
      const fail = results.find((r) => r.check_id === 'completion-requires-receipts');
      expect(fail?.passed).toBe(false);
      expect(fail?.blocked).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('passes one_way_door when approved', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-door-'));
    try {
      process.env.OTTO_CHECKS_DIR = dir;
      const store = new CheckStore(dir);
      store.listResult();
      const runner = new CheckRunner(store);
      const results = runner.evaluateOneWayDoor({ approved: true });
      const door = results.find((r) => r.check_id === 'one-way-door-approval');
      expect(door?.passed).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });
});
