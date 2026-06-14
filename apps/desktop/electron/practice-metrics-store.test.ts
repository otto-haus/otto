import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PracticeMetricsStore } from './practice-metrics-store';

describe('PracticeMetricsStore', () => {
  test('recordRun rejects slugs that escape the metrics directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-metrics-'));
    const dir = join(tmp, 'metrics');
    try {
      const store = new PracticeMetricsStore(dir);
      expect(() =>
        store.recordRun({
          slug: '../outside',
          runId: 'run_1',
          receiptId: 'receipt_1',
          receiptPath: join(tmp, 'receipt.json'),
          status: 'success',
        }),
      ).toThrow(/practice metric slug/i);
      expect(existsSync(join(tmp, 'outside.json'))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
