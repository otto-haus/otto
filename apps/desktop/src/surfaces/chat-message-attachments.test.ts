import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, 'Chat.tsx'), 'utf8');

describe('sent message attachment rendering (#277)', () => {
  it('renders inline thumbnails for user messages with attachment footers', () => {
    expect(chatSource).toContain('parseSentMessageDisplay');
    expect(chatSource).toContain('MessageAttachmentStrip');
    expect(chatSource).toMatch(/isUser\s*\?\s*\(\(\)\s*=>\s*\{[\s\S]*parseSentMessageDisplay/);
  });

  it('does not pass raw attachment footer markdown to StreamMarkdown for user messages', () => {
    expect(chatSource).toMatch(/displayBody\s*\?\s*\([\s\S]*StreamMarkdown text=\{displayBody\}/);
    expect(chatSource).not.toMatch(/isUser[\s\S]{0,120}StreamMarkdown text=\{m\.text\}/);
  });

  it('sends runtime payload with attachment bytes instead of path footer text', () => {
    expect(chatSource).toContain('buildRuntimeSendPayload');
    expect(chatSource).toContain('await rt.send(payload)');
  });
});
