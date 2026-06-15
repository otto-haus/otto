import { describe, expect, test } from 'bun:test';
import {
  DISPLAY_THEME_STORAGE_KEY,
  normalizeDisplayTheme,
  resolveEffectiveTheme,
  windowBackgroundForTheme,
} from '../electron/shared/display-theme';
import {
  clearLegacyDisplayThemeLocalStorage,
  ensureDisplayThemeAuthority,
  readLegacyDisplayThemeFromLocalStorage,
} from './display-preferences';

describe('display preferences', () => {
  test('normalizeDisplayTheme falls back to light', () => {
    expect(normalizeDisplayTheme('dark')).toBe('dark');
    expect(normalizeDisplayTheme('system')).toBe('system');
    expect(normalizeDisplayTheme('bogus')).toBe('light');
  });

  test('resolveEffectiveTheme honors system preference', () => {
    expect(resolveEffectiveTheme('light', true)).toBe('light');
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('system', false)).toBe('light');
  });

  test('windowBackgroundForTheme maps to shell colors', () => {
    expect(windowBackgroundForTheme('light')).toBe('#fafafa');
    expect(windowBackgroundForTheme('dark')).toBe('#17171a');
  });

  test('storage key is stable', () => {
    expect(DISPLAY_THEME_STORAGE_KEY).toBe('otto.display.theme.v1');
  });
});

describe('display theme authority (#732)', () => {
  test('ensureDisplayThemeAuthority keeps config theme and clears legacy localStorage', async () => {
    const store = new Map<string, string>();
    const ls = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    };
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });

    store.set(DISPLAY_THEME_STORAGE_KEY, 'dark');
    const theme = await ensureDisplayThemeAuthority({
      config: {
        get: async () => ({ theme: 'light' }),
        set: async () => ({ theme: 'light' }),
      },
    });

    expect(theme).toBe('light');
    expect(store.has(DISPLAY_THEME_STORAGE_KEY)).toBe(false);

    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
  });

  test('ensureDisplayThemeAuthority migrates legacy localStorage into config (#611)', async () => {
    const store = new Map<string, string>();
    const ls = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    };
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });

    store.set(DISPLAY_THEME_STORAGE_KEY, 'dark');
    let saved: string | undefined;
    const theme = await ensureDisplayThemeAuthority({
      config: {
        get: async () => ({}),
        set: async (patch) => {
          saved = patch.theme;
          return { theme: patch.theme };
        },
      },
    });

    expect(saved).toBe('dark');
    expect(theme).toBe('dark');
    expect(store.has(DISPLAY_THEME_STORAGE_KEY)).toBe(false);
    expect(readLegacyDisplayThemeFromLocalStorage()).toBeNull();

    clearLegacyDisplayThemeLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
  });
});
