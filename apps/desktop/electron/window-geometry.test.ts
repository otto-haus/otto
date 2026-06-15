import { describe, expect, test } from 'bun:test';
import { attachWindowGeometryHandlers, refreshWindowAfterGeometryChange } from './window-geometry';

function mockWindow(overrides: Partial<Record<string, unknown>> = {}) {
  const listeners: Record<string, Array<() => void>> = {};
  const win = {
    isDestroyed: () => false,
    isVisible: () => true,
    isFocused: () => false,
    isMaximized: () => true,
    isFullScreen: () => false,
    show: () => {},
    focus: () => {},
    webContents: {
      isDestroyed: () => false,
      invalidate: () => {},
    },
    on: (event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    ...overrides,
  };
  return { win, listeners };
}

describe('refreshWindowAfterGeometryChange', () => {
  test('focuses and invalidates when maximized', () => {
    let focused = false;
    let invalidated = false;
    const { win } = mockWindow({
      focus: () => {
        focused = true;
      },
      webContents: {
        isDestroyed: () => false,
        invalidate: () => {
          invalidated = true;
        },
      },
    });

    refreshWindowAfterGeometryChange(win as never);
    expect(focused).toBe(true);
    expect(invalidated).toBe(true);
  });

  test('shows hidden maximized windows before focus', () => {
    let shown = false;
    const { win } = mockWindow({
      isVisible: () => false,
      show: () => {
        shown = true;
      },
    });

    refreshWindowAfterGeometryChange(win as never);
    expect(shown).toBe(true);
  });

  test('no-ops on destroyed window', () => {
    const { win } = mockWindow({ isDestroyed: () => true });
    expect(() => refreshWindowAfterGeometryChange(win as never)).not.toThrow();
  });
});

describe('attachWindowGeometryHandlers', () => {
  test('registers geometry event listeners', () => {
    const { win, listeners } = mockWindow();
    attachWindowGeometryHandlers(win as never);
    expect(listeners.maximize?.length).toBe(1);
    expect(listeners.resize?.length).toBe(1);
    expect(listeners['enter-full-screen']?.length).toBe(1);
  });
});
