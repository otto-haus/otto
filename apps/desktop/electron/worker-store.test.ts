import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkerStore } from './worker-store';

describe('WorkerStore', () => {
  test('updateStatus accepts valid worker statuses and deduplicates receipts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-workers-'));
    try {
      const store = new WorkerStore(dir);
      const worker = store.spawn({ ticket_id: 'ticket-1' });

      const review = store.updateStatus(worker.id, 'review', 'receipt-1');
      const done = store.updateStatus(worker.id, 'done', 'receipt-1');

      expect(review?.status).toBe('review');
      expect(done?.status).toBe('done');
      expect(done?.receipt_ids).toEqual(['receipt-1']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('updateStatus rejects invalid worker statuses without rewriting the worker', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-workers-'));
    try {
      const store = new WorkerStore(dir);
      const worker = store.spawn({ ticket_id: 'ticket-1' });

      expect(() => store.updateStatus(worker.id, 'finished' as never, 'receipt-1')).toThrow('Invalid worker status');
      const persisted = JSON.parse(readFileSync(worker.path, 'utf8'));
      expect(persisted.status).toBe('running');
      expect(persisted.receipt_ids).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
