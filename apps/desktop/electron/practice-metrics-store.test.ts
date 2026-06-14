import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

  test('normalizes accepted slugs before returning and storing metrics', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-metrics-'));
    const dir = join(tmp, 'metrics');
    try {
      const store = new PracticeMetricsStore(dir);
      const record = store.recordRun({
        slug: ' field-note ',
        runId: 'run_1',
        receiptId: 'receipt_1',
        receiptPath: join(tmp, 'receipt.json'),
        status: 'success',
      });
      expect(record.slug).toBe('field-note');
      expect(JSON.parse(readFileSync(join(dir, 'field-note.json'), 'utf8')).slug).toBe('field-note');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('list skips malformed local metric filenames', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-practice-metrics-'));
    const dir = join(tmp, 'metrics');
    try {
      const store = new PracticeMetricsStore(dir);
      store.patch('field-note', { uses: 2 });
      writeFileSync(join(dir, '.json'), '{}');
      writeFileSync(join(dir, '..json'), '{}');
      writeFileSync(join(dir, 'bad\\name.json'), '{}');
      expect(store.list().map((record) => record.slug)).toEqual(['field-note']);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
