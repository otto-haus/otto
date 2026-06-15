import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { WINDOW_BACKGROUND, windowBackgroundForTheme } from './shared/display-theme';

describe('Electron window background', () => {
  test('stays aligned with the renderer display theme tokens', () => {
    const mainSource = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
    const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

    expect(mainSource).toContain('windowBackgroundForPref');
    expect(mainSource).not.toContain("backgroundColor: '#f8f7f2'");
    expect(windowBackgroundForTheme('light')).toBe(WINDOW_BACKGROUND.light);
    expect(windowBackgroundForTheme('dark')).toBe(WINDOW_BACKGROUND.dark);
    expect(stylesSource).toContain('[data-theme="dark"]');
    expect(stylesSource).toContain('--bg: oklch(0.985 0.002 270);');
    expect(stylesSource).toContain('body { min-height: 100vh; background: var(--bg); }');
  });
});
