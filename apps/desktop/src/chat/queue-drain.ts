import { INFLIGHT_STALE_MS, nextQueueItemForThread, queueMatchesThread, type QueueItem } from './queue-storage';

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

export type QueueSendOutcome =
  | { ok: true }
  | { ok: false; reason: string };

export const DEFAULT_QUEUE_SEND_TIMEOUT_MS = INFLIGHT_STALE_MS;

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

const failureReasonFromError = (err: unknown): string => {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  const text = String(err ?? '').trim();
  return text || 'Send failed.';
};

/** Run one queued send with an optional watchdog for hung transports. */
export async function runQueuedSend(
  send: (text: string) => Promise<void>,
  text: string,
  options?: { timeoutMs?: number },
): Promise<QueueSendOutcome> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_QUEUE_SEND_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      send(text),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Send timed out before the runtime finished.')),
          timeoutMs,
        );
      }),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: failureReasonFromError(err) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Simulate retry → drain → success/failure without React or sockets. */
export async function drainRetriedQueueItem(
  queue: QueueItem[],
  threadId: string | null | undefined,
  send: (text: string) => Promise<void>,
  options?: { retryId?: string; timeoutMs?: number },
): Promise<{ queue: QueueItem[]; outcome: QueueSendOutcome | null }> {
  const retried = queue.map((item) => {
    const shouldRetry = item.state === 'failed'
      && queueMatchesThread(item, threadId)
      && (!options?.retryId || item.id === options.retryId);
    return shouldRetry ? { ...item, state: 'queued' as const, failureReason: undefined } : item;
  });

  const plan = planQueueDrain({
    queue: retried,
    ready: true,
    activeThreadId: threadId,
    busy: false,
    draining: false,
  });
  if (plan.action !== 'send') return { queue: retried, outcome: null };

  const outcome = await runQueuedSend(send, plan.item.text, options);
  if (outcome.ok) {
    return {
      queue: retried.filter((item) => item.id !== plan.item.id),
      outcome,
    };
  }

  return {
    queue: [
      ...retried.filter((item) => item.id !== plan.item.id),
      {
        ...plan.item,
        state: 'failed',
        failureReason: outcome.reason,
      },
    ],
    outcome,
  };
}
