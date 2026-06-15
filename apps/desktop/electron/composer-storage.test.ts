import { afterEach, describe, expect, test } from 'bun:test';
import {
  attachmentsKey,
  draftKey,
  LEGACY_ATTACHMENTS_KEY,
  LEGACY_DRAFT_KEY,
  readStoredAttachments,
  readStoredDraft,
  writeStoredAttachments,
  writeStoredDraft,
} from '../src/chat/composer-storage';

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

describe('composer storage keys (#547)', () => {
  test('each thread id maps to distinct draft and attachment keys', () => {
    expect(draftKey('thread_a')).toBe('otto.chat.draft.thread_a.v1');
    expect(draftKey('thread_b')).toBe('otto.chat.draft.thread_b.v1');
    expect(draftKey('thread_a')).not.toBe(draftKey('thread_b'));
    expect(attachmentsKey('thread_a')).toBe('otto.chat.attachments.thread_a.v1');
    expect(attachmentsKey(null)).toBe(LEGACY_ATTACHMENTS_KEY);
    expect(draftKey(null)).toBe(LEGACY_DRAFT_KEY);
  });

  test('draft and attachments do not bleed across threads', () => {
    installStorage();
    writeStoredDraft('thread_a', 'draft for a');
    writeStoredDraft('thread_b', 'draft for b');
    writeStoredAttachments('thread_a', [{
      id: 'a1',
      name: 'a.png',
      mime: 'image/png',
      path: '/tmp/a.png',
      url: 'otto-attachment://a.png',
      size: 1,
    }]);

    expect(readStoredDraft('thread_a')).toBe('draft for a');
    expect(readStoredDraft('thread_b')).toBe('draft for b');
    expect(readStoredAttachments('thread_b')).toEqual([]);
    expect(readStoredAttachments('thread_a')).toHaveLength(1);
  });
});
