import { describe, expect, test } from 'bun:test';
import { displayThreadTitle, splitThreadSections, type ThreadSummary } from './ThreadList';

describe('displayThreadTitle', () => {
  test('uses a friendly fallback for empty and default chat titles', () => {
    expect(displayThreadTitle('')).toBe('New chat');
    expect(displayThreadTitle('   New Chat   ')).toBe('New chat');
  });

  test('hides raw local thread keys generated with dash or underscore separators', () => {
    expect(displayThreadTitle('local-1712345678901')).toBe('New chat');
    expect(displayThreadTitle('local_1712345678901')).toBe('New chat');
  });

  test('hides staging smoke thread identifiers', () => {
    expect(displayThreadTitle('046-thread-smoke')).toBe('Chat session');
  });
});

describe('splitThreadSections', () => {
  const row = (id: string, pinned = false): ThreadSummary => ({
    id,
    conversationId: null,
    title: id,
    updatedAt: 0,
    pinned,
  });

  test('keeps unpinned threads in recents only', () => {
    const { pinned, recents } = splitThreadSections([row('active'), row('older')]);
    expect(pinned.map((thread) => thread.id)).toEqual([]);
    expect(recents.map((thread) => thread.id)).toEqual(['active', 'older']);
  });

  test('keeps pinned threads out of recents', () => {
    const { pinned, recents } = splitThreadSections([row('pinned', true), row('recent')]);
    expect(pinned.map((thread) => thread.id)).toEqual(['pinned']);
    expect(recents.map((thread) => thread.id)).toEqual(['recent']);
  });
});
