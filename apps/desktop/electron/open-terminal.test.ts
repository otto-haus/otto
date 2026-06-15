import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveWorkspaceRoot } from './open-terminal';

describe('open-terminal', () => {
  test('resolveWorkspaceRoot prefers explicit git root', () => {
    const tmp = join(tmpdir(), `otto-terminal-${Date.now()}`);
    mkdirSync(join(tmp, '.git'), { recursive: true });
    try {
      expect(resolveWorkspaceRoot(tmp)).toBe(tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('resolveWorkspaceRoot falls back to OTTO_ROOT when set', () => {
    const tmp = join(tmpdir(), `otto-terminal-root-${Date.now()}`);
    mkdirSync(join(tmp, '.git'), { recursive: true });
    const prev = process.env.OTTO_ROOT;
    process.env.OTTO_ROOT = tmp;
    try {
      expect(resolveWorkspaceRoot()).toBe(tmp);
    } finally {
      if (prev !== undefined) process.env.OTTO_ROOT = prev;
      else delete process.env.OTTO_ROOT;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('resolveWorkspaceRoot returns a path that exists', () => {
    const root = resolveWorkspaceRoot();
    expect(existsSync(root)).toBe(true);
  });
});
