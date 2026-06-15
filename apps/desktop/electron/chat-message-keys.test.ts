import { afterEach, describe, expect, test } from 'bun:test';
import {
  LEGACY_MESSAGES_KEY,
  messagesKey,
  readStoredMessages,
  type StoredChatMsg,
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

  test('empty thread does not inherit legacy chat history by default', () => {
    const legacy: StoredChatMsg = { id: 'legacy-1', who: 'user', text: 'old default history' };
    const storage = fakeStorage({ [LEGACY_MESSAGES_KEY]: JSON.stringify([legacy]) });

    expect(readStoredMessages('thread_new', { storage })).toEqual([]);
  });

  test('legacy chat history fallback is explicit for first-load migration', () => {
    const legacy: StoredChatMsg = { id: 'legacy-1', who: 'otto', text: 'migrate me' };
    const storage = fakeStorage({ [LEGACY_MESSAGES_KEY]: JSON.stringify([legacy]) });

    expect(readStoredMessages('thread_initial', { storage, allowLegacyFallback: true })).toEqual([legacy]);
  });

  test('explicit legacy fallback does not override thread-specific history', () => {
    const legacy: StoredChatMsg = { id: 'legacy-1', who: 'user', text: 'old default history' };
    const thread: StoredChatMsg = { id: 'thread-1', who: 'otto', text: 'current thread history' };
    const storage = fakeStorage({
      [LEGACY_MESSAGES_KEY]: JSON.stringify([legacy]),
      [messagesKey('thread_existing')]: JSON.stringify([thread]),
    });

    expect(readStoredMessages('thread_existing', { storage, allowLegacyFallback: true })).toEqual([thread]);
  });
});

function fakeStorage(entries: Record<string, string>): Pick<Storage, 'getItem'> {
  return {
    getItem: (key: string) => entries[key] ?? null,
  };
}
