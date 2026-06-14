import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';

describe('Electron window background', () => {
  test('matches the CSS warm-paper background token', () => {
    const mainSource = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
    const stylesSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

    const windowBackground = mainSource.match(/backgroundColor:\s*['"](?<color>#[0-9a-f]{6})['"]/i)?.groups?.color;
    const cssBackground = stylesSource.match(/--bg:\s*(?<color>#[0-9a-f]{6})\b/i)?.groups?.color;

    expect(windowBackground).toBe('#f8f7f2');
    expect(windowBackground).toBe(cssBackground);
  });
});
