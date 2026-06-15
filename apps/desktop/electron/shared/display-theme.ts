export type DisplayTheme = 'light' | 'dark' | 'system';

export const DISPLAY_THEME_STORAGE_KEY = 'otto.display.theme.v1';

export const WINDOW_BACKGROUND = {
  light: '#fafafa',
  dark: '#17171a',
} as const;

export function normalizeDisplayTheme(value: unknown): DisplayTheme {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'light';
}

export function resolveEffectiveTheme(
  pref: DisplayTheme,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

export function windowBackgroundForTheme(theme: 'light' | 'dark'): string {
  return WINDOW_BACKGROUND[theme];
}
