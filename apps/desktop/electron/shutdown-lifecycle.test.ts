import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('shutdown-lifecycle', () => {
  let prevHome: string | undefined;
  let tempHome: string;

  afterEach(() => {
    if (prevHome === undefined) delete process.env.OTTO_HOME;
    else process.env.OTTO_HOME = prevHome;
    if (tempHome) rmSync(tempHome, { recursive: true, force: true });
  });

  const loadFresh = async () => {
    prevHome = process.env.OTTO_HOME;
    tempHome = mkdtempSync(join(tmpdir(), 'otto-shutdown-'));
    process.env.OTTO_HOME = tempHome;
    return import('./shutdown-lifecycle');
  };

  test('first launch is clean; unclean prior marker reports dirty on next start', async () => {
    const mod = await loadFresh();
    const first = mod.noteAppSessionStart();
    expect(first.dirtyShutdown).toBe(false);
    expect(existsSync(join(tempHome, 'session-active'))).toBe(true);

    const second = mod.noteAppSessionStart();
    expect(second.dirtyShutdown).toBe(true);

    mod.markCleanShutdown();
    expect(existsSync(join(tempHome, 'session-active'))).toBe(false);
    expect(existsSync(join(tempHome, 'last-clean-shutdown.json'))).toBe(true);

    const third = mod.noteAppSessionStart();
    expect(third.dirtyShutdown).toBe(false);
  });

  test('readShutdownStatus reflects marker and last clean timestamp', async () => {
    const mod = await loadFresh();
    mod.noteAppSessionStart();
    const dirty = mod.readShutdownStatus();
    expect(dirty.dirtyShutdown).toBe(true);
    expect(dirty.lastCleanShutdownAt).toBeNull();

    mod.markCleanShutdown();
    const clean = mod.readShutdownStatus();
    expect(clean.dirtyShutdown).toBe(false);
    expect(clean.lastCleanShutdownAt).toMatch(/^\d{4}-/);
  });
});
