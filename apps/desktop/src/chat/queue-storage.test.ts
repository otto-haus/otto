import { afterEach, describe, expect, test } from 'bun:test';
import {
  createQueueItem,
  hasDuplicateQueueText,
  INFLIGHT_KEY,
  INFLIGHT_STALE_MS,
  isSmokeQueueText,
  LEGACY_QUEUE_KEY,
  LEGACY_QUEUE_V2_KEY,
  nextQueueItemForThread,
  previewQueueText,
  promoteQueueItemForThread,
  QUEUE_KEY,
  queueDisplayItemsForThread,
  queueHasAttachments,
  queueMatchesThread,
  readQueue,
  removeQueueItem,
  retryFailedQueueItemsForThread,
  sanitizeQueue,
  splitQueueText,
  updateQueueItemText,
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

  test('readQueue merges both legacy v2 and v1 storage keys', () => {
    installStorage();
    localStorage.setItem(LEGACY_QUEUE_V2_KEY, JSON.stringify([
      { id: 'legacy-v2', text: 'Older v2 queued item.', createdAt: Date.now(), state: 'queued' },
    ]));
    localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify([
      { id: 'legacy-v1', text: 'Older v1 queued item.', createdAt: Date.now(), state: 'queued' },
    ]));

    const queue = readQueue();

    expect(queue.map((item) => item.id)).toEqual(['legacy-v2', 'legacy-v1']);
    expect(localStorage.getItem(LEGACY_QUEUE_V2_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_QUEUE_KEY)).toBeNull();
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

  test('readQueue marks stale in-flight messages as failed instead of dropping them', () => {
    installStorage();
    const staleCreatedAt = Date.now() - INFLIGHT_STALE_MS - 1000;
    localStorage.setItem(INFLIGHT_KEY, JSON.stringify({
      id: 'stale-inflight',
      text: 'Message stuck in flight',
      createdAt: staleCreatedAt,
      state: 'sending',
      threadId: 'thread_a',
    }));

    const queue = readQueue();

    expect(queue).toEqual([
      expect.objectContaining({
        id: 'stale-inflight',
        state: 'failed',
        text: 'Message stuck in flight',
        threadId: 'thread_a',
      }),
    ]);
    expect(localStorage.getItem(INFLIGHT_KEY)).toBeNull();
  });

  test('readQueue rehydrates in-flight messages after queued work with thread scope', () => {
    installStorage();
    localStorage.setItem(QUEUE_KEY, JSON.stringify([
      { id: 'queued-a', text: 'Already queued for A.', createdAt: Date.now(), state: 'queued', threadId: 'thread_a' },
    ]));
    localStorage.setItem(INFLIGHT_KEY, JSON.stringify({
      id: 'inflight-a',
      text: 'Restored in-flight for A.',
      createdAt: Date.now(),
      state: 'sending',
      threadId: 'thread_a',
    }));

    const queue = readQueue();

    expect(queue.map((item) => `${item.id}:${item.threadId ?? 'legacy'}`)).toEqual([
      'queued-a:thread_a',
      'inflight-a:thread_a',
    ]);
    expect(nextQueueItemForThread(queue, 'thread_a')?.id).toBe('queued-a');
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

  test('display metadata marks the next active-thread queued item', () => {
    const items: QueueItem[] = [
      { id: 'failed-a', text: 'failed for A', createdAt: 1, state: 'failed', threadId: 'thread_a' },
      { id: 'queued-b', text: 'queued for B', createdAt: 2, state: 'queued', threadId: 'thread_b' },
      { id: 'queued-a', text: 'first queued for A', createdAt: 3, state: 'queued', threadId: 'thread_a' },
      { id: 'legacy', text: 'legacy applies to any thread', createdAt: 4, state: 'queued', threadId: null },
    ];

    expect(queueDisplayItemsForThread(items, 'thread_a').map(({ id, isNext, sendPosition }) => ({
      id,
      isNext,
      sendPosition,
    }))).toEqual([
      { id: 'failed-a', isNext: false, sendPosition: null },
      { id: 'queued-a', isNext: true, sendPosition: 1 },
      { id: 'legacy', isNext: false, sendPosition: 2 },
    ]);
  });

  test('hasDuplicateQueueText rejects duplicate queued and in-flight text for a thread', () => {
    installStorage();
    const items: QueueItem[] = [
      { id: 'queued', text: 'Same prompt please', createdAt: 1, state: 'queued', threadId: 'thread_a' },
    ];
    expect(hasDuplicateQueueText(items, 'thread_a', 'Same prompt please')).toBe(true);
    expect(hasDuplicateQueueText(items, 'thread_a', 'Different prompt')).toBe(false);
    localStorage.setItem(INFLIGHT_KEY, JSON.stringify({
      id: 'inflight',
      text: 'In flight duplicate',
      createdAt: Date.now(),
      state: 'sending',
      threadId: 'thread_a',
    }));
    expect(hasDuplicateQueueText([], 'thread_a', 'In flight duplicate')).toBe(true);
  });

  test('retrying a failed item keeps already queued work next', () => {
    const items: QueueItem[] = [
      { id: 'failed-a', text: 'failed for A', createdAt: 1, state: 'failed', threadId: 'thread_a' },
      { id: 'queued-a', text: 'already queued for A', createdAt: 2, state: 'queued', threadId: 'thread_a' },
      { id: 'queued-b', text: 'queued for B', createdAt: 3, state: 'queued', threadId: 'thread_b' },
    ];

    const retried = retryFailedQueueItemsForThread(items, 'thread_a', 'failed-a');

    expect(retried.map((item) => `${item.id}:${item.state}`)).toEqual([
      'queued-a:queued',
      'queued-b:queued',
      'failed-a:queued',
    ]);
    expect(nextQueueItemForThread(retried, 'thread_a')?.id).toBe('queued-a');
  });

  test('promoteQueueItemForThread moves a waiting item to the front without reordering other threads', () => {
    const items: QueueItem[] = [
      { id: 'queued-a-1', text: 'first for A', createdAt: 1, state: 'queued', threadId: 'thread_a' },
      { id: 'queued-a-2', text: 'second for A', createdAt: 2, state: 'queued', threadId: 'thread_a' },
      { id: 'queued-b', text: 'queued for B', createdAt: 3, state: 'queued', threadId: 'thread_b' },
    ];

    const promoted = promoteQueueItemForThread(items, 'thread_a', 'queued-a-2');

    expect(promoted.map((item) => item.id)).toEqual(['queued-a-2', 'queued-a-1', 'queued-b']);
    expect(nextQueueItemForThread(promoted, 'thread_a')?.id).toBe('queued-a-2');
  });

  test('removeQueueItem and updateQueueItemText mutate only the targeted row', () => {
    const items: QueueItem[] = [
      { id: 'a', text: 'keep me', createdAt: 1, state: 'queued', threadId: 'thread_a' },
      { id: 'b', text: 'change me', createdAt: 2, state: 'queued', threadId: 'thread_a' },
    ];

    expect(updateQueueItemText(items, 'b', 'edited body').find((item) => item.id === 'b')?.text).toBe('edited body');
    expect(removeQueueItem(items, 'b').map((item) => item.id)).toEqual(['a']);
  });

  test('splitQueueText preserves attachment footer across reconnect storage', () => {
    const text = 'Please inspect this screenshot.\n\nAttached local images:\n1. shot.png — ~/.otto/attachments/shot.png';
    expect(splitQueueText(text)).toEqual({
      body: 'Please inspect this screenshot.',
      attachmentLines: ['1. shot.png — ~/.otto/attachments/shot.png'],
    });
    expect(queueHasAttachments(text)).toBe(true);
    expect(previewQueueText(text)).toBe('Please inspect this screenshot. · 1 attachment');
  });
});
