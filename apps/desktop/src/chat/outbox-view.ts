import type { QueueItemView } from '../runtime';

/**
 * Pure, renderer-side selectors that derive the "N couldn't send" banner from the MAIN-process
 * outbox snapshot. There is NO localStorage/React source of truth here — these functions take the
 * durable snapshot the main process broadcasts and shape it for display only.
 */

export type QueueBannerItem = QueueItemView & { isNext: boolean; sendPosition: number | null };

export type QueueBannerCounts = {
  total: number;
  waiting: number; // queued
  inFlight: number; // sending | streaming
  failed: number;
  blocked: number;
  interrupted: number;
};

/** Items the main process already filtered to "still visible" (excludes sent/cancelled). */
export function selectQueueBanner(items: QueueItemView[], threadId: string | null | undefined): QueueBannerItem[] {
  let sendPosition = 0;
  return items
    .filter((item) => (threadId ? item.threadId === threadId : true))
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((item) => {
      if (item.state !== 'queued') return { ...item, isNext: false, sendPosition: null };
      sendPosition += 1;
      return { ...item, isNext: sendPosition === 1, sendPosition };
    });
}

export function queueBannerCounts(items: QueueBannerItem[]): QueueBannerCounts {
  const counts: QueueBannerCounts = { total: items.length, waiting: 0, inFlight: 0, failed: 0, blocked: 0, interrupted: 0 };
  for (const item of items) {
    switch (item.state) {
      case 'queued':
        counts.waiting += 1;
        break;
      case 'sending':
      case 'streaming':
        counts.inFlight += 1;
        break;
      case 'failed':
        counts.failed += 1;
        break;
      case 'blocked':
        counts.blocked += 1;
        break;
      case 'interrupted':
        counts.interrupted += 1;
        break;
      default:
        break;
    }
  }
  return counts;
}

/** Rows the operator can retry (failed/interrupted/blocked). */
export function retryableItems(items: QueueBannerItem[]): QueueBannerItem[] {
  return items.filter((i) => i.state === 'failed' || i.state === 'interrupted' || i.state === 'blocked');
}

/** Does the banner have anything to show at all? */
export function hasBannerItems(items: QueueBannerItem[]): boolean {
  return items.length > 0;
}

/** Stable display label for a row's state (operator-facing). */
export function stateLabel(item: QueueBannerItem): string {
  if (item.isNext) return 'next';
  switch (item.state) {
    case 'queued':
      return item.sendPosition && item.sendPosition > 1 ? `#${item.sendPosition}` : 'waiting';
    case 'sending':
      return 'sending';
    case 'streaming':
      return 'streaming';
    case 'failed':
      return 'failed';
    case 'blocked':
      return 'blocked';
    case 'interrupted':
      return 'interrupted';
    default:
      return item.state;
  }
}
