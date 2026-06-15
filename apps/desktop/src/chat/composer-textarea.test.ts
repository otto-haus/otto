import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPOSER_TEXTAREA_MAX_HEIGHT_PX, syncComposerTextareaHeight } from './composer-textarea';

function mockTextarea(scrollHeight: number): HTMLTextAreaElement {
  const style: { height: string; overflowY: string } = { height: '', overflowY: '' };
  return {
    get scrollHeight() {
      return scrollHeight;
    },
    style,
  } as HTMLTextAreaElement;
}

describe('composer textarea auto-grow (#278)', () => {
  it('caps height and enables internal scroll at the limit', () => {
    const el = mockTextarea(320);
    syncComposerTextareaHeight(el);
    expect(el.style.height).toBe(`${COMPOSER_TEXTAREA_MAX_HEIGHT_PX}px`);
    expect(el.style.overflowY).toBe('auto');
  });

  it('shrinks to content below the limit', () => {
    const el = mockTextarea(72);
    syncComposerTextareaHeight(el);
    expect(el.style.height).toBe('72px');
    expect(el.style.overflowY).toBe('hidden');
  });

  it('resets to one line after clear', () => {
    const el = mockTextarea(24);
    syncComposerTextareaHeight(el);
    expect(el.style.height).toBe('24px');
    expect(el.style.overflowY).toBe('hidden');
  });

  it('LiveChat wires layout sync on draft changes', () => {
    const chatSource = readFileSync(join(import.meta.dir, '../surfaces/Chat.tsx'), 'utf8');
    expect(chatSource).toContain("from '../chat/composer-textarea'");
    expect(chatSource).toContain('syncComposerTextareaHeight');
    expect(chatSource).toContain('useLayoutEffect');
  });
});
