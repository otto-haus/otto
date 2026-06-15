import type { DisplayTheme } from '../electron/shared/display-theme';
import {
  DISPLAY_THEME_STORAGE_KEY,
  normalizeDisplayTheme,
  resolveEffectiveTheme,
} from '../electron/shared/display-theme';

export type { DisplayTheme } from '../electron/shared/display-theme';
export {
  DISPLAY_THEME_STORAGE_KEY,
  WINDOW_BACKGROUND,
  normalizeDisplayTheme,
  resolveEffectiveTheme,
  windowBackgroundForTheme,
} from '../electron/shared/display-theme';

export function readStoredDisplayTheme(): DisplayTheme {
  try {
    return normalizeDisplayTheme(localStorage.getItem(DISPLAY_THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function applyDisplayTheme(pref: DisplayTheme = readStoredDisplayTheme()): 'light' | 'dark' {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = resolveEffectiveTheme(pref, prefersDark);
  document.documentElement.dataset.theme = effective;
  document.documentElement.style.colorScheme = effective;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', effective);
  return effective;
}

export function persistDisplayTheme(theme: DisplayTheme): 'light' | 'dark' {
  try {
    localStorage.setItem(DISPLAY_THEME_STORAGE_KEY, theme);
  } catch {
    /* best effort */
  }
  return applyDisplayTheme(theme);
}

let systemThemeListener: (() => void) | null = null;

export function watchSystemDisplayTheme(pref: DisplayTheme): () => void {
  if (systemThemeListener) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', systemThemeListener);
    systemThemeListener = null;
  }
  if (pref !== 'system') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
    applyDisplayTheme('system');
  };
  systemThemeListener = sync;
  mq.addEventListener('change', sync);
  return () => mq.removeEventListener('change', sync);
}
