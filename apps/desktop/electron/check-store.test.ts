import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CheckStore } from './check-store';

const check = (id: string) => ({
  schema: 'otto.check.v1' as const,
  id,
  version: '1.0.0',
  source: 'test',
  trigger: { event: 'done_claim' as const },
  inspect: { require: ['evidence_attached' as const] },
  on_fail: {
    block_claim: true,
    message: 'Attach evidence before claiming done.',
    write_receipt: true,
  },
});

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

  test('save writes valid check ids inside the checks directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-checks-'));
    const dir = join(tmp, 'checks');
    try {
      const store = new CheckStore(dir);

      store.save(check('completion-requires-receipts'));

      expect(existsSync(join(dir, 'completion-requires-receipts.yaml'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('save rejects check ids that escape the checks directory', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-checks-'));
    const dir = join(tmp, 'checks');
    try {
      const store = new CheckStore(dir);

      expect(() => store.save(check('../outside'))).toThrow('Invalid check id');
      expect(() => store.save(check('..\\outside'))).toThrow('Invalid check id');
      expect(existsSync(join(tmp, 'outside.yaml'))).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
