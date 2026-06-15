import { describe, expect, test } from 'bun:test';
import {
  applyWindowLaunchMode,
  browserWindowShowsOnCreate,
  resolveActivateAction,
  resolveWindowLaunchMode,
  shouldEnforceSingleInstance,
  surfaceWindow,
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

describe('resolveActivateAction (#683)', () => {
  test('creates a window when none exist', () => {
    expect(resolveActivateAction(0, false)).toBe('create');
  });

  test('surfaces an existing window even when a hidden one already counts', () => {
    expect(resolveActivateAction(1, true)).toBe('surface');
  });

  test('no-ops when windows exist but none is the tracked main window', () => {
    expect(resolveActivateAction(1, false)).toBe('noop');
  });
});

describe('surfaceWindow (#683)', () => {
  test('restores, shows, and focuses a hidden/minimized window', () => {
    const calls: string[] = [];
    const win = {
      isMinimized: () => true,
      isVisible: () => false,
      restore: () => calls.push('restore'),
      show: () => calls.push('show'),
      focus: () => calls.push('focus'),
    };
    surfaceWindow(win as never);
    expect(calls).toEqual(['restore', 'show', 'focus']);
  });

  test('only focuses a window that is already visible', () => {
    const calls: string[] = [];
    const win = {
      isMinimized: () => false,
      isVisible: () => true,
      restore: () => calls.push('restore'),
      show: () => calls.push('show'),
      focus: () => calls.push('focus'),
    };
    surfaceWindow(win as never);
    expect(calls).toEqual(['focus']);
  });
});

describe('shouldEnforceSingleInstance (#681)', () => {
  test('enforces by default', () => {
    expect(shouldEnforceSingleInstance({})).toBe(true);
  });

  test('opts out when OTTO_ALLOW_MULTIPLE_INSTANCES is set', () => {
    expect(shouldEnforceSingleInstance({ OTTO_ALLOW_MULTIPLE_INSTANCES: '1' })).toBe(false);
    expect(shouldEnforceSingleInstance({ OTTO_ALLOW_MULTIPLE_INSTANCES: 'true' })).toBe(false);
  });
});
