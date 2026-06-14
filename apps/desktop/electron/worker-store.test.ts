import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkerStore } from './worker-store';

describe('WorkerStore', () => {
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
