import { describe, expect, test } from 'bun:test';
import { LEGACY_MESSAGES_KEY, messagesKey } from '../src/chat/message-storage';

/** Documents 046 two-thread message key isolation for reviewers. */
describe('chat message storage keys (046)', () => {
  test('each thread id maps to a distinct localStorage key', () => {
    const a = messagesKey('thread_a');
    const b = messagesKey('thread_b');
    expect(a).not.toBe(b);
    expect(a).toBe('otto.chat.messages.thread_a.v1');
    expect(b).toBe('otto.chat.messages.thread_b.v1');
  });

  test('null thread uses legacy key only', () => {
    expect(messagesKey(null)).toBe(LEGACY_MESSAGES_KEY);
    expect(messagesKey(null)).not.toBe(messagesKey('thread_a'));
  });
});
