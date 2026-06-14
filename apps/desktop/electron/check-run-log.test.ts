import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

  test('normalizes persisted count values before recording', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-log-'));
    const path = join(dir, 'run-log.json');
    try {
      writeFileSync(path, JSON.stringify({
        'completion-requires-receipts': {
          pass_count: '2',
          fail_count: 1,
        },
      }));

      const stats = new CheckRunLogStore(path).record('completion-requires-receipts', true);

      expect(stats.pass_count).toBe(3);
      expect(stats.fail_count).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('replaces malformed persisted count values with zeroes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-check-log-'));
    const path = join(dir, 'run-log.json');
    try {
      writeFileSync(path, JSON.stringify({
        'completion-requires-receipts': {
          pass_count: 'not-a-count',
          fail_count: -2,
        },
      }));

      const stats = new CheckRunLogStore(path).record('completion-requires-receipts', false);

      expect(stats.pass_count).toBe(0);
      expect(stats.fail_count).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
