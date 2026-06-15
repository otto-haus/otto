import { nextQueueItemForThread, type QueueItem } from './queue-storage';

export type QueueDrainInputs = {
  queue: QueueItem[];
  ready: boolean;
  activeThreadId: string | null | undefined;
  busy: boolean;
  draining: boolean;
};

export type QueueDrainPlan =
  | { action: 'idle' }
  | { action: 'send'; item: QueueItem; nextQueue: QueueItem[] };

/** Pure drain planner used by Chat.tsx and integration tests. */
export function planQueueDrain({
  queue,
  ready,
  activeThreadId,
  busy,
  draining,
}: QueueDrainInputs): QueueDrainPlan {
  if (!ready || busy || draining || queue.length === 0) return { action: 'idle' };
  if (!activeThreadId) return { action: 'idle' };

  const next = nextQueueItemForThread(queue, activeThreadId);
  if (!next) return { action: 'idle' };

  return {
    action: 'send',
    item: next,
    nextQueue: queue.filter((item) => item.id !== next.id),
  };
}
