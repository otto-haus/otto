import { describe, expect, test } from 'bun:test';
import type { ChatMsg } from '../runtime';
import { redactSensitiveContent, serializeConversationMarkdown } from './conversation-markdown';

describe('redactSensitiveContent', () => {
  test('redacts local paths and secrets', () => {
    const input = [
      'See /Users/seb/.otto/attachments/a.png',
      'key=sk-live-abcdefghijklmnopqrstuvwxyz',
      'Auth: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
    ].join('\n');
    const out = redactSensitiveContent(input);
    expect(out).toContain('[redacted: local path]');
    expect(out).toContain('[redacted: secret]');
    expect(out).not.toContain('/Users/seb/.otto');
    expect(out).not.toContain('sk-live-');
  });
});

describe('serializeConversationMarkdown', () => {
  test('formats roles, activity blocks, attachments, and errors', () => {
    const messages: ChatMsg[] = [
      {
        id: 'user-1718366400000',
        who: 'user',
        text: 'Please review this.\n\nAttached local images:\n1. shot.png — /Users/seb/.otto/attachments/shot.png',
      },
      {
        id: 'otto-1718366401000',
        who: 'otto',
        text: 'Blocked by autonomy gate.',
        checkBlock: {
          checkName: 'reversibility',
          message: 'Destructive command needs approval.',
          receiptId: 'rcpt-1',
          standardId: 'std-1',
        },
        receiptInline: {
          id: 'rcpt-2',
          status: 'blocked',
          action: 'autonomy.permission.deny',
          summary: 'Tool permission denied: Bash',
          authority: 'human (permission gate)',
        },
      },
      { id: 'err-1718366402000', who: 'error', text: 'Runtime disconnected.' },
    ];

    const md = serializeConversationMarkdown({
      title: 'Handoff thread',
      exportedAt: '2026-06-14T12:00:00.000Z',
      threadId: 'local-thread-1',
      conversationId: 'conv-abc',
      messages,
    });

    expect(md).toContain('# Handoff thread');
    expect(md).toContain('_Exported from otto · 2026-06-14T12:00:00.000Z_');
    expect(md).toContain('## You · 2024-06-14T12:00:00.000Z');
    expect(md).toContain('[attachment: local file]');
    expect(md).not.toContain('/Users/seb/.otto');
    expect(md).toContain('> **Check block:** reversibility');
    expect(md).toContain('> **Receipt:** `rcpt-2`');
    expect(md).toContain('## Error · 2024-06-14T12:00:02.000Z');
    expect(md).toContain('Runtime disconnected.');
  });

  test('returns empty-state markdown when there are no messages', () => {
    const md = serializeConversationMarkdown({ title: 'New chat', messages: [] });
    expect(md).toContain('_No messages in this thread yet._');
  });
});
