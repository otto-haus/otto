import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckRunLogStore } from './check-run-log';

describe('CheckRunLogStore', () => {
  test('records pass and fail counts per check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-log-'));
    const path = join(dir, 'run-log.json');
    try {
      const store = new CheckRunLogStore(path);
      expect(store.get('completion-requires-receipts')).toBeNull();

      store.record('completion-requires-receipts', false);
      store.record('completion-requires-receipts', true);

      const stats = store.get('completion-requires-receipts');
      expect(stats?.pass_count).toBe(1);
      expect(stats?.fail_count).toBe(1);
      expect(stats?.last_passed).toBe(true);
      expect(stats?.last_run_at).toBeTruthy();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
