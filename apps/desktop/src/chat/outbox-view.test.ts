import { describe, expect, test } from 'bun:test';
import type { QueueItemView } from '../runtime';
import { queueBannerCounts, retryableItems, selectQueueBanner, stateLabel } from './outbox-view';

/**
 * These tests prove the banner is derived ENTIRELY from the main-process snapshot — the input is a
 * plain `QueueItemView[]` (what `otto:outbox` broadcasts). There is no localStorage, no React, no
 * renderer-owned durable state involved in producing the banner.
 */

function view(partial: Partial<QueueItemView> & { id: string; createdAt: number; state: QueueItemView['state'] }): QueueItemView {
  return {
    threadId: 'thread-a',
    clientMessageId: `c-${partial.id}`,
    text: partial.id,
    attachments: [],
    model: null,
    effort: null,
    attemptCount: 0,
    maxAttempts: 3,
    errorCode: null,
    errorMessage: null,
    updatedAt: partial.createdAt,
    startedAt: null,
    finishedAt: null,
    ...partial,
  };
}

describe('selectQueueBanner (derives banner purely from main snapshot)', () => {
  test('marks the oldest queued row as next and numbers the rest', () => {
    const items = [
      view({ id: 'b', createdAt: 2, state: 'queued' }),
      view({ id: 'a', createdAt: 1, state: 'queued' }),
      view({ id: 'c', createdAt: 3, state: 'failed' }),
    ];
    const banner = selectQueueBanner(items, 'thread-a');
    expect(banner.map((i) => i.id)).toEqual(['a', 'b', 'c']); // sorted oldest-first
    expect(banner[0].isNext).toBe(true);
    expect(banner[0].sendPosition).toBe(1);
    expect(banner[1].isNext).toBe(false);
    expect(banner[1].sendPosition).toBe(2);
    expect(banner[2].sendPosition).toBeNull(); // failed rows have no send position
  });

  test('filters to the active thread', () => {
    const items = [
      view({ id: 'a', createdAt: 1, state: 'queued' }),
      view({ id: 'x', createdAt: 2, state: 'queued', threadId: 'thread-b' }),
    ];
    expect(selectQueueBanner(items, 'thread-a').map((i) => i.id)).toEqual(['a']);
  });

  test('counts states for the summary line', () => {
    const items = selectQueueBanner(
      [
        view({ id: 'q', createdAt: 1, state: 'queued' }),
        view({ id: 's', createdAt: 2, state: 'sending' }),
        view({ id: 'f', createdAt: 3, state: 'failed' }),
        view({ id: 'bl', createdAt: 4, state: 'blocked' }),
        view({ id: 'i', createdAt: 5, state: 'interrupted' }),
      ],
      'thread-a',
    );
    expect(queueBannerCounts(items)).toEqual({
      total: 5,
      waiting: 1,
      inFlight: 1,
      failed: 1,
      blocked: 1,
      interrupted: 1,
    });
    expect(retryableItems(items).map((i) => i.id)).toEqual(['f', 'bl', 'i']);
  });

  test('state labels are operator-facing', () => {
    const [next, second, failed] = selectQueueBanner(
      [
        view({ id: 'a', createdAt: 1, state: 'queued' }),
        view({ id: 'b', createdAt: 2, state: 'queued' }),
        view({ id: 'f', createdAt: 3, state: 'failed' }),
      ],
      'thread-a',
    );
    expect(stateLabel(next)).toBe('next');
    expect(stateLabel(second)).toBe('#2');
    expect(stateLabel(failed)).toBe('failed');
  });
});
