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

  test('valid 73k thread history restores the bounded recent tail', () => {
    installStorage();
    const older = Array.from({ length: 75 }, (_, i) => ({
      id: `older-${i}`,
      who: 'otto' as const,
      text: `older ${i} ${'x'.repeat(1000)}`,
    }));
    const recent = [
      { id: 'tail-user', who: 'user' as const, text: 'recent user turn' },
      { id: 'tail-otto', who: 'otto' as const, text: 'recent otto reply' },
    ];
    const raw = JSON.stringify([...older, ...recent]);
    expect(raw.length).toBeGreaterThan(73_000);
    expect(raw.length).toBeLessThan(1_000_000);
    localStorage.setItem(messagesKey('thread_large'), raw);

    const restored = readStoredMessages('thread_large');

    expect(restored.map((m) => m.id)).toContain('tail-user');
    expect(restored.map((m) => m.id)).toContain('tail-otto');
    expect(restored.some((m) => m.id.startsWith('history-suppressed-'))).toBe(false);
    expect(restored.length).toBeLessThanOrEqual(12);
    expect(restored.reduce((sum, m) => sum + m.text.length, 0)).toBeLessThanOrEqual(7_000);
  });

  test('corrupt thread history fails closed to empty history', () => {
    installStorage();
    localStorage.setItem(messagesKey('thread_corrupt'), '[{"id":"1","who":"user","text":"unterminated"');

    expect(readStoredMessages('thread_corrupt')).toEqual([]);
  });

  test('pathological thread history still uses the startup safety gate', () => {
    installStorage();
    localStorage.setItem(messagesKey('thread_huge'), `[${' '.repeat(1_000_001)}]`);

    const restored = readStoredMessages('thread_huge');

    expect(restored).toHaveLength(1);
    expect(restored[0]?.text).toContain('too large to restore safely at startup');
  });
});
