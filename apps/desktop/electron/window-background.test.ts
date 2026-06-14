import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';

describe('Electron window background', () => {
  test('stays aligned with the renderer warm-paper background', () => {
    const mainSource = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
    const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

    const windowBackground = mainSource.match(/backgroundColor:\s*['"](?<color>#[0-9a-f]{6})['"]/i)?.groups?.color;

    expect(windowBackground).toBe('#f8f7f2');
    expect(stylesSource).toContain('color-scheme: light;');
    expect(stylesSource).toContain('--bg: oklch(0.975 0.012 85);');
    expect(stylesSource).toContain('body { min-height: 100vh; background: var(--bg); }');
  });
});
