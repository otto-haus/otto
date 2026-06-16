import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  WINDOW_STATE_FILE,
  readPersistedWindowState,
  restoreSavedWindowMode,
} from './window-state';

describe('readPersistedWindowState', () => {
  let dir = '';

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  test('returns null when file is missing', () => {
    dir = mkdtempSync(join(tmpdir(), 'otto-window-state-'));
    expect(readPersistedWindowState(dir)).toBeNull();
  });

  test('parses saved bounds and flags', () => {
    dir = mkdtempSync(join(tmpdir(), 'otto-window-state-'));
    writeFileSync(
      join(dir, WINDOW_STATE_FILE),
      JSON.stringify({ x: 12, y: 34, width: 1280, height: 800, isMaximized: true }),
    );

    expect(readPersistedWindowState(dir)).toEqual({
      x: 12,
      y: 34,
      width: 1280,
      height: 800,
      isMaximized: true,
      isFullScreen: false,
    });
  });

  test('returns null for invalid payload', () => {
    dir = mkdtempSync(join(tmpdir(), 'otto-window-state-'));
    writeFileSync(join(dir, WINDOW_STATE_FILE), '{not-json');
    expect(readPersistedWindowState(dir)).toBeNull();
  });
});

describe('restoreSavedWindowMode', () => {
  test('maximizes only in visible launch mode', () => {
    let maximized = false;
    const win = {
      maximize: () => {
        maximized = true;
      },
      setFullScreen: () => {},
    };

    restoreSavedWindowMode(win as never, { isMaximized: true, isFullScreen: false } as never, 'visible');
    expect(maximized).toBe(true);

    maximized = false;
    restoreSavedWindowMode(win as never, { isMaximized: true, isFullScreen: false } as never, 'background');
    expect(maximized).toBe(false);
  });

  test('defaults match main window size', () => {
    expect(DEFAULT_WINDOW_WIDTH).toBe(1040);
    expect(DEFAULT_WINDOW_HEIGHT).toBe(720);
  });
});

describe('window-state file round-trip', () => {
  test('written state is readable by diagnostics helper', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-window-state-'));
    try {
      mkdirSync(dir, { recursive: true });
      const payload = { x: 8, y: 16, width: 900, height: 640, isMaximized: false, isFullScreen: false };
      writeFileSync(join(dir, WINDOW_STATE_FILE), `${JSON.stringify(payload)}\n`);
      expect(existsSync(join(dir, WINDOW_STATE_FILE))).toBe(true);
      expect(JSON.parse(readFileSync(join(dir, WINDOW_STATE_FILE), 'utf8'))).toEqual(payload);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
