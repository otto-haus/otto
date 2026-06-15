import type { BrowserWindow } from 'electron';
import { nativeTheme } from 'electron';
import type { DisplayTheme } from './shared/display-theme';
import { WINDOW_BACKGROUND, normalizeDisplayTheme, resolveEffectiveTheme } from './shared/display-theme';

export function effectiveThemeFromPref(pref: DisplayTheme | undefined): 'light' | 'dark' {
  return resolveEffectiveTheme(normalizeDisplayTheme(pref), nativeTheme.shouldUseDarkColors);
}

export function windowBackgroundForPref(pref: DisplayTheme | undefined): string {
  return WINDOW_BACKGROUND[effectiveThemeFromPref(pref)];
}

export function syncWindowBackground(win: BrowserWindow, pref: DisplayTheme | undefined): void {
  win.setBackgroundColor(windowBackgroundForPref(pref));
}

/** Re-sync native window chrome when macOS appearance changes while theme=system (#606). */
export function watchSystemWindowBackground(
  getPref: () => DisplayTheme | undefined,
  getWin: () => BrowserWindow | null | undefined,
): () => void {
  const onUpdated = () => {
    if (normalizeDisplayTheme(getPref()) !== 'system') return;
    const win = getWin();
    if (!win || win.isDestroyed()) return;
    syncWindowBackground(win, 'system');
  };
  nativeTheme.on('updated', onUpdated);
  return () => nativeTheme.removeListener('updated', onUpdated);
}
