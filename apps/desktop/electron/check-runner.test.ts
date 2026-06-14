import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckRunner } from './check-runner';
import { CheckStore } from './check-store';
import { ReceiptStore } from './receipt-store';
import { ReceiptWriter } from './receipt-writer';

describe('CheckRunner', () => {
  test('blocks done_claim without evidence and writes check.failed receipt with fields', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-run-'));
    const receiptsDir = join(dir, 'receipts');
    try {
      process.env.OTTO_CHECKS_DIR = join(dir, 'checks');
      const store = new CheckStore(join(dir, 'checks'));
      store.listResult();
      const runner = new CheckRunner(store, new ReceiptWriter(receiptsDir));
      const results = runner.evaluateDoneClaim({
        acceptance_criteria: [{ id: 'AC1', text: 'Ship feature', proof: '' }],
        review: { verdict: '+1', evidence: [] },
      });
      const fail = results.find((r) => r.check_id === 'completion-requires-receipts');
      expect(fail?.passed).toBe(false);
      expect(fail?.blocked).toBe(true);
      expect(fail?.receipt_id).toBeTruthy();

      const receipt = new ReceiptStore(receiptsDir).get(fail!.receipt_id!);
      expect(receipt?.action).toBe('check.failed');
      expect(receipt?.status).toBe('blocked');
      expect(receipt?.subject.type).toBe('check');
      expect(receipt?.subject.id).toBe('completion-requires-receipts');
      expect(receipt?.input?.trigger).toBe('done_claim');
      expect(receipt?.result?.data?.check_id).toBe('completion-requires-receipts');
      expect(receipt?.blocker?.code).toBe('check_failed');
    } finally {
      rmSync(dir, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });

  test('blocks one_way_door without approval and writes check.failed receipt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-door-block-'));
    const receiptsDir = join(dir, 'receipts');
    try {
      process.env.OTTO_CHECKS_DIR = join(dir, 'checks');
      const store = new CheckStore(join(dir, 'checks'));
      store.listResult();
      const runner = new CheckRunner(store, new ReceiptWriter(receiptsDir));
      const results = runner.evaluateOneWayDoor({});
      const door = results.find((r) => r.check_id === 'one-way-door-approval');
      expect(door?.passed).toBe(false);
      expect(door?.blocked).toBe(true);
      expect(door?.receipt_id).toBeTruthy();

      const receipt = new ReceiptStore(receiptsDir).get(door!.receipt_id!);
      expect(receipt?.action).toBe('check.failed');
      expect(receipt?.input?.trigger).toBe('one_way_door_action');
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
