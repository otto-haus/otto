import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';

const styles = readFileSync(join(import.meta.dir, '../styles.css'), 'utf8');
const chatSource = readFileSync(join(import.meta.dir, '../surfaces/Chat.tsx'), 'utf8');

test('chat canvas shares one centered column width token', () => {
  expect(styles).toContain('--chat-column-max: 780px');
  expect(styles).toContain('.chat__column');
  expect(styles).toMatch(/\.chat__streamInner[\s\S]*max-width:\s*var\(--chat-column-max\)/);
});

test('LiveChat wraps header and composer in chat__column', () => {
  expect(chatSource).toContain('className="chat__column chat__headInner"');
  expect(chatSource).toContain('<div className="chat__column">');
});
