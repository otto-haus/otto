import { describe, expect, test } from 'bun:test';
import { getMainWindow, setMainWindow } from './main-window';

describe('main-window', () => {
  test('tracks the current BrowserWindow ref', () => {
    setMainWindow(null);
    expect(getMainWindow()).toBeNull();

    const win = { id: 'dock-reopen-proof' } as never;
    setMainWindow(win);
    expect(getMainWindow()).toBe(win);

    setMainWindow(null);
    expect(getMainWindow()).toBeNull();
  });
});
