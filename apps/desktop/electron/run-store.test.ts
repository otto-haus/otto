import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunStore } from './run-store';

describe('RunStore', () => {
  test('record sanitizes caller-provided id for filename only', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-run-store-'));
    try {
      const runsDir = join(root, 'runs');
      const store = new RunStore(runsDir);
      const run = store.record({ id: '../escaped-run', practice: 'ticketcraft' });

      expect(run.id).toBe('../escaped-run');
      expect(run.path).toBe(join(runsDir, 'escaped-run.json'));
      expect(existsSync(run.path)).toBe(true);
      expect(existsSync(join(root, 'escaped-run.json'))).toBe(false);
      expect(store.list().runs.map((entry) => entry.id)).toEqual(['../escaped-run']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
