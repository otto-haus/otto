import type { DisplayTheme } from '../electron/shared/display-theme';
import type { OttoApi } from '../electron/preload';
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

function bootDisplayTheme(): DisplayTheme | undefined {
  if (typeof window === 'undefined') return undefined;
  const boot = (window as Window & { otto?: OttoApi }).otto?.boot;
  return boot?.displayTheme();
}

/** Legacy renderer localStorage — read once for migration only (#732). */
export function readLegacyDisplayThemeFromLocalStorage(): DisplayTheme | null {
  try {
    const raw = localStorage.getItem(DISPLAY_THEME_STORAGE_KEY);
    if (raw === null) return null;
    return normalizeDisplayTheme(raw);
  } catch {
    return null;
  }
}

export function clearLegacyDisplayThemeLocalStorage(): void {
  try {
    localStorage.removeItem(DISPLAY_THEME_STORAGE_KEY);
  } catch {
    /* best effort */
  }
}

/** Boot theme from main-process config; web preview falls back to legacy localStorage. */
export function readBootDisplayTheme(): DisplayTheme {
  try {
    const fromMain = bootDisplayTheme();
    if (fromMain === 'light' || fromMain === 'dark' || fromMain === 'system') return fromMain;
  } catch {
    /* preload unavailable */
  }
  return readLegacyDisplayThemeFromLocalStorage() ?? 'light';
}

/** @deprecated Use readBootDisplayTheme — config.json is authoritative. */
export const readStoredDisplayTheme = readBootDisplayTheme;

export function applyDisplayTheme(pref: DisplayTheme): 'light' | 'dark' {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = resolveEffectiveTheme(pref, prefersDark);
  document.documentElement.dataset.theme = effective;
  document.documentElement.style.colorScheme = effective;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', effective);
  return effective;
}

/** Apply renderer chrome only — persistence goes through config.set (#732). */
export function persistDisplayTheme(theme: DisplayTheme): 'light' | 'dark' {
  return applyDisplayTheme(theme);
}

export async function ensureDisplayThemeAuthority(api: {
  config: {
    get: () => Promise<{ theme?: DisplayTheme }>;
    set: (patch: { theme: DisplayTheme }) => Promise<{ theme?: DisplayTheme }>;
  };
}): Promise<DisplayTheme> {
  const cfg = await api.config.get();
  if (cfg.theme) {
    clearLegacyDisplayThemeLocalStorage();
    return cfg.theme;
  }
  const legacy = readLegacyDisplayThemeFromLocalStorage();
  if (legacy !== null) {
    const next = await api.config.set({ theme: legacy });
    clearLegacyDisplayThemeLocalStorage();
    return next.theme ?? legacy;
  }
  return 'light';
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
