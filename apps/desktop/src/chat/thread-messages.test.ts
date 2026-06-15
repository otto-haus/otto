import { afterEach, describe, expect, test } from 'bun:test';
import {
  loadThreadMessages,
  loadThreadMessagesForView,
  persistActiveThread,
  persistLeavingThread,
} from './thread-messages';
import { messagesKey, flushMessages } from './message-storage';

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

  test('persistLeavingThread prefers cache over stale view ref', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', [{ id: '1', who: 'user', text: 'cached A' }]);

    persistLeavingThread(cache, 'thread_a', 'thread_b', [{ id: '1', who: 'user', text: 'stale view' }]);

    const raw = localStorage.getItem(messagesKey('thread_a'));
    expect(raw).toContain('cached A');
    expect(raw).not.toContain('stale view');
  });

  test('two-thread switch leaves distinct storage keys', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();
    cache.set('thread_a', [{ id: '1', who: 'user', text: 'marker-a' }]);
    flushMessages('thread_a', cache.get('thread_a')!);

    persistLeavingThread(cache, 'thread_a', 'thread_b', [{ id: '1', who: 'user', text: 'marker-a' }]);
    cache.set('thread_b', [{ id: '2', who: 'user', text: 'marker-b' }]);
    flushMessages('thread_b', cache.get('thread_b')!);

    const loadedA = loadThreadMessagesForView('thread_a', cache);
    const loadedB = loadThreadMessagesForView('thread_b', cache);

    expect(loadedA.map((m) => m.text)).toEqual(['marker-a']);
    expect(loadedB.map((m) => m.text)).toEqual(['marker-b']);
    expect(localStorage.getItem(messagesKey('thread_a'))).not.toContain('marker-b');
    expect(localStorage.getItem(messagesKey('thread_b'))).not.toContain('marker-a');
  });

  test('persistActiveThread writes current thread without a switch', () => {
    installStorage();
    const cache = new Map<string, { id: string; who: 'user'; text: string }[]>();

    persistActiveThread(cache, 'thread_a', [{ id: '1', who: 'user', text: 'before new chat' }]);

    expect(localStorage.getItem(messagesKey('thread_a'))).toContain('before new chat');
  });
});
