import { describe, expect, test } from 'bun:test';
import {
  DISPLAY_THEME_STORAGE_KEY,
  normalizeDisplayTheme,
  resolveEffectiveTheme,
  windowBackgroundForTheme,
} from '../electron/shared/display-theme';

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
