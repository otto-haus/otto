import { describe, expect, test } from 'bun:test';
import type { ThreadSummary } from '../components/ui/ThreadList';
import type { ChatMsg } from '../runtime';
import { archiveCurrentThread } from './thread-index';

const userMessage = (text: string): ChatMsg => ({ id: text, who: 'user', text });

describe('archiveCurrentThread', () => {
  test('keeps existing local threads when archiving a new null-conversation thread', () => {
    const existing: ThreadSummary = {
      id: 'local-older-thread',
      conversationId: null,
      title: 'Previous local chat',
      updatedAt: 1,
    };

    const archived = archiveCurrentThread([existing], null, [userMessage('New local chat')]);

    expect(archived).toHaveLength(2);
    expect(archived[0]?.conversationId).toBe(null);
    expect(archived[0]?.title).toBe('New local chat');
    expect(archived.map((thread) => thread.id)).toContain('local-older-thread');
  });

  test('replaces the matching live conversation thread', () => {
    const existing: ThreadSummary = {
      id: 'conv-1',
      conversationId: 'conv-1',
      title: 'Old title',
      updatedAt: 1,
    };

    const archived = archiveCurrentThread([existing], 'conv-1', [userMessage('Updated title')]);

    expect(archived).toHaveLength(1);
    expect(archived[0]?.id).toBe('conv-1');
    expect(archived[0]?.title).toBe('Updated title');
  });
});
