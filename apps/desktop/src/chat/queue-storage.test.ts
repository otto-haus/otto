import { afterEach, describe, expect, test } from 'bun:test';
import {
  createQueueItem,
  isSmokeQueueText,
  LEGACY_QUEUE_KEY,
  LEGACY_QUEUE_V2_KEY,
  nextQueueItemForThread,
  previewQueueText,
  QUEUE_KEY,
  queueMatchesThread,
  readQueue,
  sanitizeQueue,
  type QueueItem,
} from './queue-storage';

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

describe('queue-storage', () => {
  test('drops smoke-test thread markers', () => {
    const items: QueueItem[] = [
      { id: '1', text: '046-rev10-thread-a-20260614141000', createdAt: Date.now(), state: 'failed' },
      { id: '2', text: 'Help me plan the release.', createdAt: Date.now(), state: 'queued' },
    ];
    expect(sanitizeQueue(items).map((x) => x.id)).toEqual(['2']);
  });

  test('preview hides smoke ids', () => {
    expect(previewQueueText('046-smoke-thread-b-20260614141000')).toBe('Automated smoke message');
    expect(previewQueueText('Draft a short plan I can react to.')).toBe('Draft a short plan I can react to.');
  });

  test('isSmokeQueueText matches staging patterns', () => {
    expect(isSmokeQueueText('046-rev10-thread-a-20260614141000')).toBe(true);
    expect(isSmokeQueueText('hello world')).toBe(false);
  });

  test('creates unique ids even when messages are queued in the same millisecond', () => {
    const first = createQueueItem('first', 'queued', 'thread_a');
    const second = createQueueItem('second', 'queued', 'thread_a');
    expect(first.id).not.toBe(second.id);
    expect(first.state).toBe('queued');
    expect(second.state).toBe('queued');
    expect(first.threadId).toBe('thread_a');
    expect(second.threadId).toBe('thread_a');
  });

  test('readQueue migrates legacy storage and persists the sanitized queue', () => {
    installStorage();
    localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify([
      { id: 'smoke', text: '046-smoke-thread-b-20260614141000', createdAt: Date.now(), state: 'failed' },
      { id: 'real', text: 'Keep this operator message.', createdAt: Date.now(), state: 'queued' },
    ]));

    const queue = readQueue();

    expect(queue.map((item) => item.id)).toEqual(['real']);
    expect(localStorage.getItem(LEGACY_QUEUE_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')).toEqual(queue);
  });

  test('readQueue migrates v2 queue storage into the thread-aware v3 key', () => {
    installStorage();
    localStorage.setItem(LEGACY_QUEUE_V2_KEY, JSON.stringify([
      { id: 'legacy-v2', text: 'Keep this older queued item.', createdAt: Date.now(), state: 'queued' },
    ]));

    const queue = readQueue();

    expect(queue).toEqual([
      expect.objectContaining({ id: 'legacy-v2', text: 'Keep this older queued item.', state: 'queued', threadId: null }),
    ]);
    expect(localStorage.getItem(LEGACY_QUEUE_V2_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')).toEqual(queue);
  });

  test('readQueue preserves legacy messages when current storage already exists', () => {
    installStorage();
    localStorage.setItem(QUEUE_KEY, JSON.stringify([
      { id: 'current', text: 'Current queued message.', createdAt: Date.now(), state: 'queued' },
      { id: 'same-id', text: 'Current wins this duplicate.', createdAt: Date.now(), state: 'queued' },
    ]));
    localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify([
      { id: 'legacy', text: 'Legacy queued message.', createdAt: Date.now(), state: 'queued' },
      { id: 'same-id', text: 'Legacy duplicate should be ignored.', createdAt: Date.now(), state: 'queued' },
    ]));

    const queue = readQueue();

    expect(queue.map((item) => item.id)).toEqual(['current', 'same-id', 'legacy']);
    expect(queue.find((item) => item.id === 'same-id')?.text).toBe('Current wins this duplicate.');
    expect(localStorage.getItem(LEGACY_QUEUE_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')).toEqual(queue);
  });

  test('thread-aware queue drains only the active conversation', () => {
    const items: QueueItem[] = [
      { id: 'a', text: 'follow-up for A', createdAt: 1, state: 'queued', threadId: 'thread_a' },
      { id: 'b', text: 'follow-up for B', createdAt: 2, state: 'queued', threadId: 'thread_b' },
      { id: 'legacy', text: 'legacy queue item', createdAt: 3, state: 'queued', threadId: null },
    ];

    expect(queueMatchesThread(items[0], 'thread_b')).toBe(false);
    expect(queueMatchesThread(items[1], 'thread_b')).toBe(true);
    expect(queueMatchesThread(items[2], 'thread_b')).toBe(true);
    expect(nextQueueItemForThread(items, 'thread_b')?.id).toBe('b');
  });
});
