import { describe, expect, test } from 'bun:test';
import {
  applyWindowLaunchMode,
  browserWindowShowsOnCreate,
  resolveWindowLaunchMode,
} from './window-launch';

describe('resolveWindowLaunchMode', () => {
  test('defaults smoke runs to background', () => {
    expect(resolveWindowLaunchMode({ OTTO_SMOKE: '1' })).toBe('background');
    expect(resolveWindowLaunchMode({ OTTO_SMOKE: 'true' })).toBe('background');
  });

  test('defaults non-smoke runs to visible', () => {
    expect(resolveWindowLaunchMode({})).toBe('visible');
  });

  test('honors explicit OTTO_WINDOW_MODE', () => {
    expect(resolveWindowLaunchMode({ OTTO_WINDOW_MODE: 'hidden', OTTO_SMOKE: '1' })).toBe('hidden');
    expect(resolveWindowLaunchMode({ OTTO_WINDOW_MODE: 'minimized' })).toBe('minimized');
    expect(resolveWindowLaunchMode({ OTTO_WINDOW_MODE: 'visible', OTTO_SMOKE: '1' })).toBe('visible');
  });

  test('ignores unknown OTTO_WINDOW_MODE values', () => {
    expect(resolveWindowLaunchMode({ OTTO_WINDOW_MODE: 'fullscreen', OTTO_SMOKE: '1' })).toBe('background');
  });
});

describe('browserWindowShowsOnCreate', () => {
  test('only visible mode shows on create', () => {
    expect(browserWindowShowsOnCreate('visible')).toBe(true);
    expect(browserWindowShowsOnCreate('background')).toBe(false);
    expect(browserWindowShowsOnCreate('hidden')).toBe(false);
    expect(browserWindowShowsOnCreate('minimized')).toBe(false);
  });
});

describe('applyWindowLaunchMode', () => {
  test('background mode shows inactive on ready-to-show', () => {
    const handlers: Record<string, () => void> = {};
    const win = {
      once: (event: string, handler: () => void) => {
        handlers[event] = handler;
      },
      showInactive: () => {},
      minimize: () => {},
    };
    let inactive = false;
    win.showInactive = () => {
      inactive = true;
    };
    applyWindowLaunchMode(win as never, 'background');
    handlers['ready-to-show']?.();
    expect(inactive).toBe(true);
  });

  test('hidden mode does not show on ready-to-show', () => {
    const handlers: Record<string, () => void> = {};
    const win = {
      once: (event: string, handler: () => void) => {
        handlers[event] = handler;
      },
      showInactive: () => {
        throw new Error('should not show');
      },
      minimize: () => {},
    };
    applyWindowLaunchMode(win as never, 'hidden');
    handlers['ready-to-show']?.();
  });
});
