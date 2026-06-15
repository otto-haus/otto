import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, 'Chat.tsx'), 'utf8');
const copySource = readFileSync(join(import.meta.dir, '../copy/surfaces.ts'), 'utf8');

describe('chat composer readiness contract (#289)', () => {
  it('keeps the draft textarea editable while runtime is not ready', () => {
    expect(chatSource).not.toMatch(/<textarea[\s\S]*?disabled=\{!ready\}/);
    expect(chatSource).toContain('Draft while setup finishes…');
  });

  it('gates send and explains why when runtime is not ready', () => {
    expect(chatSource).toContain('disabled={!ready || (!draft.trim() && attachments.length === 0)}');
    expect(chatSource).toContain('title={ready ? undefined : chatCopy.composerSendBlockedTitle}');
    expect(copySource).toContain('composerNotReadyHint');
    expect(copySource).toContain('composerSendBlockedTitle');
  });

  it('does not dim the whole composer when only send is blocked', () => {
    expect(chatSource).toContain("ready ? '' : ' promptbox--send-blocked'");
    expect(chatSource).not.toContain("ready ? '' : ' promptbox--disabled'");
  });

  it('allows starter prompts to populate draft before runtime is ready', () => {
    expect(chatSource).not.toMatch(/className="chatStarter"[\s\S]*?disabled=\{!ready\}/);
  });
});
