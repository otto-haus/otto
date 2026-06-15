import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chatSource = readFileSync(join(import.meta.dir, '../surfaces/Chat.tsx'), 'utf8');
const copySource = readFileSync(join(import.meta.dir, '../copy/surfaces.ts'), 'utf8');

describe('chat composer readiness contract (#289, #300)', () => {
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

  it('disables starter prompts until runtime is ready (#562)', () => {
    expect(chatSource).toMatch(/className="chatStarter"[\s\S]*?disabled=\{!ready\}/);
    expect(chatSource).toContain('chatCopy.starterBlockedTitle');
    expect(copySource).toContain('starterBlockedTitle');
  });

  it('does not leak ticket command grammar in the empty chat state (#74 minimalism)', () => {
    expect(copySource).not.toContain('ticketCommandHint');
    expect(chatSource).not.toContain('ticketCommandHint');
    expect(chatSource).not.toMatch(/compile ticket/i);
  });

  it('uses human no-agent copy instead of raw st.reason in runtime banner (#583)', () => {
    expect(copySource).toContain('runtimeNoAgentBody');
    expect(chatSource).toContain('runtimeSetupBannerBody(st)');
    expect(chatSource).toContain('chatCopy.runtimeNoAgentBody');
    expect(chatSource).not.toMatch(/\{st\.reason \?\? chatCopy\.runtimeNotReadyBody\}/);
  });
});

describe('chat composer chrome (#48)', () => {
  it('removes attach and stop controls from the primary prompt box', () => {
    expect(chatSource).not.toContain('promptbox__attach');
    expect(chatSource).not.toContain('promptbox__stop');
  });

  it('places model and effort pickers in the footer row, opening upward to avoid clipping', () => {
    expect(chatSource).toContain('className="promptbar__footer"');
    expect(chatSource).toContain('menuPlacement="up"');
    expect(chatSource).not.toContain('menuPlacement="down"');
  });

  it('documents Enter-default send with Tab opt-in via Settings', () => {
    expect(chatSource).toContain('shouldComposerShortcutSubmit');
    expect(chatSource).toContain('composerSendShortcut');
    expect(copySource).toContain('composerHintEnter');
    expect(copySource).toContain('composerHintTab');
    expect(copySource).toContain('composerShortcutLabel');
  });
});
