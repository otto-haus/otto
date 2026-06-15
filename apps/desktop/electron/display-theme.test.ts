import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { WINDOW_BACKGROUND } from './shared/display-theme';

describe('display-theme system chrome sync (#606)', () => {
  test('listens for nativeTheme updated and re-syncs when theme=system', () => {
    const source = readFileSync(new URL('./display-theme.ts', import.meta.url), 'utf8');
    const ipcSource = readFileSync(new URL('./ipc.ts', import.meta.url), 'utf8');

    expect(source).toContain("nativeTheme.on('updated'");
    expect(source).toContain('watchSystemWindowBackground');
    expect(source).toContain("normalizeDisplayTheme(getPref()) !== 'system'");
    expect(source).toContain('syncWindowBackground(win,');
    expect(ipcSource).toContain('watchSystemWindowBackground(() => config.get().theme, getMainWindow)');
    expect(WINDOW_BACKGROUND.light).toBe('#fafafa');
    expect(WINDOW_BACKGROUND.dark).toBe('#17171a');
  });
});
