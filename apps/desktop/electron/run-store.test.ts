import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunStore } from './run-store';

describe('RunStore', () => {
  test('records and lists run summaries newest-first', () => {
    withRunsDir((_root, runsDir) => {
      const store = new RunStore(runsDir);

      const run = store.record({
        id: 'run-recorded',
        practice: 'review',
        status: 'blocked',
        summary: 'Blocked pending proof.',
      });
      const result = store.list();

      expect(run.status).toBe('blocked');
      expect(result.storage).toBe('files');
      expect(result.skipped).toBe(0);
      expect(result.runs.map((entry) => entry.id)).toEqual(['run-recorded']);
      expect(result.runs[0]?.summary).toBe('Blocked pending proof.');
    });
  });

  test('skips persisted runs with unknown status instead of marking success', () => {
    withRunsDir((_root, runsDir) => {
      mkdirSync(runsDir, { recursive: true });
      writeFileSync(
        join(runsDir, 'bad-status.json'),
        `${JSON.stringify({
          id: 'run-bad-status',
          practice: 'review',
          status: 'done',
          started_at: '2026-06-14T00:00:00.000Z',
          ended_at: null,
          summary: 'This should not become success.',
          receipt_count: 0,
        }, null, 2)}\n`,
      );

      const result = new RunStore(runsDir).list();

      expect(result.runs).toEqual([]);
      expect(result.skipped).toBe(1);
    });
  });

  test('keeps legacy completed status mapped to success', () => {
    withRunsDir((_root, runsDir) => {
      mkdirSync(runsDir, { recursive: true });
      writeFileSync(
        join(runsDir, 'completed.json'),
        `${JSON.stringify({
          id: 'run-completed',
          practice: 'review',
          status: 'completed',
          started_at: '2026-06-14T00:00:00.000Z',
          ended_at: null,
          summary: 'Legacy completed run.',
          receipt_count: 1,
        }, null, 2)}\n`,
      );

      const result = new RunStore(runsDir).list();

      expect(result.skipped).toBe(0);
      expect(result.runs[0]?.id).toBe('run-completed');
      expect(result.runs[0]?.status).toBe('success');
    });
  });

  test('record sanitizes caller-provided id for filename only', () => {
    withRunsDir((root, runsDir) => {
      const store = new RunStore(runsDir);
      const run = store.record({ id: '../escaped-run', practice: 'ticketcraft' });

      expect(run.id).toBe('../escaped-run');
      expect(run.path.startsWith(join(runsDir, 'escaped-run-'))).toBe(true);
      expect(run.path.endsWith('.json')).toBe(true);
      expect(existsSync(run.path)).toBe(true);
      expect(existsSync(join(root, 'escaped-run.json'))).toBe(false);
      expect(store.list().runs.map((entry) => entry.id)).toEqual(['../escaped-run']);
    });
  });

  test('record falls back to a safe filename when separators erase the id', () => {
    withRunsDir((root, runsDir) => {
      const store = new RunStore(runsDir);
      const run = store.record({ id: '../..\\..', practice: 'ticketcraft' });

      expect(run.id).toBe('../..\\..');
      expect(run.path.startsWith(join(runsDir, 'run-'))).toBe(true);
      expect(run.path.endsWith('.json')).toBe(true);
      expect(existsSync(run.path)).toBe(true);
      expect(existsSync(join(root, 'run.json'))).toBe(false);
      expect(store.list().runs.map((entry) => entry.id)).toEqual(['../..\\..']);
    });
  });

  test('record does not collapse distinct unsafe ids onto the same filename', () => {
    withRunsDir((_root, runsDir) => {
      const store = new RunStore(runsDir);
      const unsafe = store.record({ id: 'a/b', practice: 'ticketcraft' });
      const plain = store.record({ id: 'ab', practice: 'ticketcraft' });

      expect(unsafe.id).toBe('a/b');
      expect(plain.id).toBe('ab');
      expect(unsafe.path).not.toBe(plain.path);
      expect(readdirSync(runsDir).sort()).toHaveLength(2);
      expect(store.list().runs.map((entry) => entry.id).sort()).toEqual(['a/b', 'ab']);
    });
  });
});

function withRunsDir(run: (root: string, runsDir: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'otto-run-store-'));
  try {
    run(root, join(root, 'runs'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
