import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckStore } from './check-store';

describe('CheckStore', () => {
  test('seeds and lists checks from repo templates', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-checks-'));
    try {
      process.env.OTTO_CHECKS_DIR = dir;
      const store = new CheckStore(dir);
      const result = store.listResult();
      expect(result.checks.some((c) => c.id === 'completion-requires-receipts')).toBe(true);
      expect(result.checks.some((c) => c.id === 'one-way-door-approval')).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      delete process.env.OTTO_CHECKS_DIR;
    }
  });
});
