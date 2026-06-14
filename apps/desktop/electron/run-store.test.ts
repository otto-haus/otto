import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
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
      expect(run.path.startsWith(join(runsDir, 'escaped-run-'))).toBe(true);
      expect(run.path.endsWith('.json')).toBe(true);
      expect(existsSync(run.path)).toBe(true);
      expect(existsSync(join(root, 'escaped-run.json'))).toBe(false);
      expect(store.list().runs.map((entry) => entry.id)).toEqual(['../escaped-run']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('record falls back to a safe filename when separators erase the id', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-run-store-'));
    try {
      const runsDir = join(root, 'runs');
      const store = new RunStore(runsDir);
      const run = store.record({ id: '../..\\..', practice: 'ticketcraft' });

      expect(run.id).toBe('../..\\..');
      expect(run.path.startsWith(join(runsDir, 'run-'))).toBe(true);
      expect(run.path.endsWith('.json')).toBe(true);
      expect(existsSync(run.path)).toBe(true);
      expect(existsSync(join(root, 'run.json'))).toBe(false);
      expect(store.list().runs.map((entry) => entry.id)).toEqual(['../..\\..']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('record does not collapse distinct unsafe ids onto the same filename', () => {
    const root = mkdtempSync(join(tmpdir(), 'otto-run-store-'));
    try {
      const runsDir = join(root, 'runs');
      const store = new RunStore(runsDir);
      const unsafe = store.record({ id: 'a/b', practice: 'ticketcraft' });
      const plain = store.record({ id: 'ab', practice: 'ticketcraft' });

      expect(unsafe.id).toBe('a/b');
      expect(plain.id).toBe('ab');
      expect(unsafe.path).not.toBe(plain.path);
      expect(readdirSync(runsDir).sort()).toHaveLength(2);
      expect(store.list().runs.map((entry) => entry.id).sort()).toEqual(['a/b', 'ab']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
