import { afterEach, describe, expect, test } from 'bun:test';
import {
  loadThreadMessages,
  loadThreadMessagesForView,
  persistActiveThread,
  persistLeavingThread,
} from './thread-messages';
import { messagesKey } from './message-storage';

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

describe('thread message persistence (046)', () => {
  test('persistLeavingThread writes leaving thread before switch', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', [{ id: '1', who: 'user', text: 'hello A' }]);

    persistLeavingThread(cache, 'thread_a', 'thread_b', [{ id: '1', who: 'user', text: 'hello A' }]);

    const raw = localStorage.getItem(messagesKey('thread_a'));
    expect(raw).toContain('hello A');
  });

  test('persistLeavingThread skips when leaving equals next thread', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();

    persistLeavingThread(cache, 'thread_a', 'thread_a', [{ id: '1', who: 'user', text: 'noop' }]);

    expect(localStorage.getItem(messagesKey('thread_a'))).toBeNull();
  });

  test('loadThreadMessagesForView prefers disk over stale empty cache', () => {
    installStorage();
    localStorage.setItem(
      messagesKey('thread_a'),
      JSON.stringify([{ id: '1', who: 'user', text: 'stored on disk' }]),
    );
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', []);

    const loaded = loadThreadMessagesForView('thread_a', cache);

    expect(loaded.map((m) => m.text)).toEqual(['stored on disk']);
    expect(cache.get('thread_a')?.map((m) => m.text)).toEqual(['stored on disk']);
  });

  test('loadThreadMessages keeps in-memory cache for active send path', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', [{ id: '1', who: 'user', text: 'in memory only' }]);

    const loaded = loadThreadMessages('thread_a', cache);

    expect(loaded.map((m) => m.text)).toEqual(['in memory only']);
    expect(localStorage.getItem(messagesKey('thread_a'))).toBeNull();
  });

  test('persistActiveThread writes current thread without a switch', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();

    persistActiveThread(cache, 'thread_a', [{ id: '1', who: 'user', text: 'before new chat' }]);

    expect(localStorage.getItem(messagesKey('thread_a'))).toContain('before new chat');
  });

  test('persistActiveThread preserves disk when in-memory view is stale empty', () => {
    installStorage();
    localStorage.setItem(
      messagesKey('thread_a'),
      JSON.stringify([{ id: '1', who: 'user', text: 'saved before new chat' }]),
    );
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', []);

    persistActiveThread(cache, 'thread_a', []);

    expect(localStorage.getItem(messagesKey('thread_a'))).toContain('saved before new chat');
  });

  test('persistLeavingThread preserves disk when in-memory view is stale empty', () => {
    installStorage();
    localStorage.setItem(
      messagesKey('thread_a'),
      JSON.stringify([{ id: '1', who: 'user', text: 'thread a on disk' }]),
    );
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', []);

    persistLeavingThread(cache, 'thread_a', 'thread_b', []);

    expect(localStorage.getItem(messagesKey('thread_a'))).toContain('thread a on disk');
  });
});
