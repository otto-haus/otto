import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { RunStore } from './run-store';

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('RunStore', () => {
  it('records and lists run summaries newest-first', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-run-store-test-'));
    const store = new RunStore(tmp);

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

  it('skips persisted runs with unknown status instead of marking success', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-run-store-test-'));
    mkdirSync(tmp, { recursive: true });
    writeFileSync(
      join(tmp, 'bad-status.json'),
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

    const result = new RunStore(tmp).list();

    expect(result.runs).toEqual([]);
    expect(result.skipped).toBe(1);
  });

  it('keeps legacy completed status mapped to success', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-run-store-test-'));
    mkdirSync(tmp, { recursive: true });
    writeFileSync(
      join(tmp, 'completed.json'),
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

    const result = new RunStore(tmp).list();

    expect(result.skipped).toBe(0);
    expect(result.runs[0]?.id).toBe('run-completed');
    expect(result.runs[0]?.status).toBe('success');
  });
});
