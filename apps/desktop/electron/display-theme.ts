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
