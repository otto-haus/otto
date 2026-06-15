import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, '../surfaces/Chat.tsx'), 'utf8');

describe('chat turn navigation UI contract', () => {
  it('memoizes stream messages so turn anchors stay stable across renders', () => {
    expect(chatSource).toContain('useMemo(');
    expect(chatSource).toMatch(/useMemo\(\s*\(\) => \[\.\.\.rt\.messages, \.\.\.cmdMessages\]/);
    expect(chatSource).toMatch(/\[rt\.messages, cmdMessages\]/);
  });

  it('resets turn focus only when the active thread changes', () => {
    expect(chatSource).toMatch(
      /turnFocusRef\.current = turnAnchors\[turnAnchors\.length - 1\][\s\S]*?\[rt\.activeThreadId\]/,
    );
    expect(chatSource).not.toMatch(/\[rt\.activeThreadId, turnAnchors\]/);
  });
});
