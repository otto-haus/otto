import { afterEach, describe, expect, test } from 'bun:test';
import {
  LEGACY_MESSAGES_KEY,
  messagesKey,
  readStoredMessages,
} from '../src/chat/message-storage';

const installStorage = () => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  } as Storage;
  return store;
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

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

  test('empty threads do not bleed legacy history from another thread', () => {
    installStorage();
    const legacy = [{ id: '1', who: 'user' as const, text: 'shared legacy' }];
    localStorage.setItem(LEGACY_MESSAGES_KEY, JSON.stringify(legacy));
    localStorage.setItem(messagesKey('thread_a'), JSON.stringify([{ id: '2', who: 'user', text: 'only a' }]));

    expect(readStoredMessages('thread_b').map((m) => m.text)).toEqual([]);
    expect(readStoredMessages('thread_a').map((m) => m.text)).toEqual(['only a']);
  });

  test('73k thread history restores instead of startup suppression warning', () => {
    installStorage();
    const threadId = 'thread_large';
    const messages = Array.from({ length: 80 }, (_, index) => ({
      id: `m-${index}`,
      who: 'user' as const,
      text: 'x'.repeat(900),
    }));
    const raw = JSON.stringify(messages);
    expect(raw.length).toBeGreaterThan(50_000);
    expect(raw.length).toBeLessThan(1_000_000);
    localStorage.setItem(messagesKey(threadId), raw);

    const restored = readStoredMessages(threadId);
    expect(restored.length).toBeGreaterThan(0);
    expect(restored.some((m) => m.text.includes('hidden because it is too large'))).toBe(false);
  });

  test('pathological multi-megabyte history stays suppressed', () => {
    installStorage();
    const threadId = 'thread_huge';
    localStorage.setItem(messagesKey(threadId), `[${' '.repeat(1_000_001)}]`);

    const restored = readStoredMessages(threadId);
    expect(restored).toHaveLength(1);
    expect(restored[0]?.text).toContain('hidden because it is too large');
  });
});
