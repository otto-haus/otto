import type { BrowserWindow } from 'electron';

/** Refresh focus and renderer paint after external bounds changes (e.g. Rectangle on macOS). */
export function refreshWindowAfterGeometryChange(win: BrowserWindow): void {
  if (win.isDestroyed()) return;

  const wc = win.webContents;
  if (wc.isDestroyed()) return;

  if (win.isMaximized() || win.isFullScreen()) {
    if (!win.isVisible()) win.show();
    win.focus();
  } else if (win.isVisible() && win.isFocused()) {
    win.focus();
  }

  wc.invalidate();
}

export function attachWindowGeometryHandlers(win: BrowserWindow): void {
  const refresh = () => refreshWindowAfterGeometryChange(win);
  win.on('maximize', refresh);
  win.on('unmaximize', refresh);
  win.on('resize', refresh);
  win.on('enter-full-screen', refresh);
  win.on('leave-full-screen', refresh);
}
