import { afterEach, describe, expect, test } from 'bun:test';
import {
  createQueueItem,
  isSmokeQueueText,
  LEGACY_QUEUE_KEY,
  previewQueueText,
  QUEUE_KEY,
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
    const first = createQueueItem('first');
    const second = createQueueItem('second');
    expect(first.id).not.toBe(second.id);
    expect(first.state).toBe('queued');
    expect(second.state).toBe('queued');
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
});
