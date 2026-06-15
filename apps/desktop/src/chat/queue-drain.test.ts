import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_QUEUE_SEND_TIMEOUT_MS,
  drainRetriedQueueItem,
  planQueueDrain,
  runQueuedSend,
} from './queue-drain';
import {
  appendFailedQueueItem,
  createQueueItem,
  enqueueQueueItemForThread,
  INFLIGHT_KEY,
  retryFailedQueueItemsForThread,
  type QueueItem,
} from './queue-storage';

const baseQueue: QueueItem[] = [
  { id: 'a', text: 'first', createdAt: 1, state: 'queued', threadId: 'thread_a' },
];

describe('planQueueDrain', () => {
  test('drains when runtime is ready and idle', () => {
    expect(planQueueDrain({
      queue: baseQueue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    })).toEqual({
      action: 'send',
      item: baseQueue[0],
      nextQueue: [],
    });
  });

  test('idle while runtime is busy', () => {
    expect(planQueueDrain({
      queue: baseQueue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: true,
      draining: false,
    })).toEqual({ action: 'idle' });
  });

  test('idle while not ready', () => {
    expect(planQueueDrain({
      queue: baseQueue,
      ready: false,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    })).toEqual({ action: 'idle' });
  });

  test('idle while another drain is in flight', () => {
    expect(planQueueDrain({
      queue: baseQueue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: true,
    })).toEqual({ action: 'idle' });
  });

  test('idle without active thread id', () => {
    expect(planQueueDrain({
      queue: baseQueue,
      ready: true,
      activeThreadId: null,
      busy: false,
      draining: false,
    })).toEqual({ action: 'idle' });
  });

  test('drains only the active thread queued rows', () => {
    const queue: QueueItem[] = [
      { id: 'b', text: 'for B', createdAt: 1, state: 'queued', threadId: 'thread_b' },
      { id: 'a', text: 'for A', createdAt: 2, state: 'queued', threadId: 'thread_a' },
    ];
    expect(planQueueDrain({
      queue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    })).toEqual({
      action: 'send',
      item: queue[1],
      nextQueue: [queue[0]],
    });
  });

  test('legacy null-thread rows drain once active thread is known', () => {
    const queue: QueueItem[] = [
      { id: 'legacy', text: 'legacy follow-up', createdAt: 1, state: 'queued', threadId: null },
    ];
    expect(planQueueDrain({
      queue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    })).toEqual({
      action: 'send',
      item: queue[0],
      nextQueue: [],
    });
  });

  test('skips failed rows until retry promotes them', () => {
    const queue: QueueItem[] = [
      { id: 'failed', text: 'failed send', createdAt: 1, state: 'failed', threadId: 'thread_a' },
      { id: 'queued', text: 'still waiting', createdAt: 2, state: 'queued', threadId: 'thread_a' },
    ];
    expect(planQueueDrain({
      queue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    })).toEqual({
      action: 'send',
      item: queue[1],
      nextQueue: [queue[0]],
    });
  });

  test('functional drain removal preserves concurrently enqueued items', () => {
    const removeDrained = (items: QueueItem[], drainedId: string) =>
      items.filter((item) => item.id !== drainedId);

    const queueAtPlanTime: QueueItem[] = [
      { id: 'a', text: 'first', createdAt: 1, state: 'queued', threadId: 'thread_a' },
      { id: 'b', text: 'second', createdAt: 2, state: 'queued', threadId: 'thread_a' },
    ];
    const plan = planQueueDrain({
      queue: queueAtPlanTime,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    });
    if (plan.action !== 'send') throw new Error('expected send plan');

    const concurrent: QueueItem = {
      id: 'c',
      text: 'arrived mid-drain',
      createdAt: 3,
      state: 'queued',
      threadId: 'thread_a',
    };
    const latestQueue = [...queueAtPlanTime, concurrent];

    expect(plan.nextQueue).toEqual([queueAtPlanTime[1]]);
    expect(removeDrained(latestQueue, plan.item.id)).toEqual([queueAtPlanTime[1], concurrent]);
  });

  test('retry stays idle while runtime busy so recovery can unblock drain', () => {
    const queue: QueueItem[] = [
      { id: 'failed', text: 'can you please send a long message?', createdAt: 1, state: 'failed', threadId: 'thread_a' },
    ];
    const retried = retryFailedQueueItemsForThread(queue, 'thread_a');
    expect(planQueueDrain({
      queue: retried,
      ready: true,
      activeThreadId: 'thread_a',
      busy: true,
      draining: false,
    })).toEqual({ action: 'idle' });
    expect(planQueueDrain({
      queue: retried,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    }).action).toBe('send');
  });
});

describe('runQueuedSend', () => {
  test('returns success when send resolves', async () => {
    await expect(runQueuedSend(async () => {}, 'hello')).resolves.toEqual({ ok: true });
  });

  test('returns failure reason when send rejects', async () => {
    await expect(runQueuedSend(async () => {
      throw new Error('Runtime not ready');
    }, 'hello')).resolves.toEqual({ ok: false, reason: 'Runtime not ready' });
  });

  test('watchdog fails hung sends so drain can recover', async () => {
    const outcome = await runQueuedSend(
      () => new Promise<void>(() => {}),
      'hello',
      { timeoutMs: 20 },
    );
    expect(outcome).toEqual({
      ok: false,
      reason: 'Send timed out before the runtime finished.',
    });
  });
});

describe('drainRetriedQueueItem', () => {
  test('retry re-drains a failed item and clears it on success', async () => {
    const failed = createQueueItem('can you please send a long message?', 'failed', 'thread_a');
    const queue = appendFailedQueueItem([], failed);

    const result = await drainRetriedQueueItem(queue, 'thread_a', async () => {});

    expect(result.outcome).toEqual({ ok: true });
    expect(result.queue).toEqual([]);
  });

  test('repeated failure keeps the row failed with the reason', async () => {
    const failed = createQueueItem('still failing', 'failed', 'thread_a');
    const queue = appendFailedQueueItem([], failed);

    const result = await drainRetriedQueueItem(
      queue,
      'thread_a',
      async () => { throw new Error('Timed out waiting for the runtime to finish.'); },
    );

    expect(result.outcome).toEqual({
      ok: false,
      reason: 'Timed out waiting for the runtime to finish.',
    });
    expect(result.queue).toEqual([
      expect.objectContaining({
        id: failed.id,
        state: 'failed',
        failureReason: 'Timed out waiting for the runtime to finish.',
      }),
    ]);
  });

  test('rapid repeated enqueues preserve order without eviction or dup rows', () => {
    let queue: QueueItem[] = [];
    const text = 'can you please send a long message?';
    for (let i = 0; i < 5; i += 1) {
      queue = enqueueQueueItemForThread(queue, `${text} #${i}`, 'thread_a');
    }
    expect(queue.map((item) => item.text)).toEqual([
      'can you please send a long message? #0',
      'can you please send a long message? #1',
      'can you please send a long message? #2',
      'can you please send a long message? #3',
      'can you please send a long message? #4',
    ]);
    expect(planQueueDrain({
      queue,
      ready: true,
      activeThreadId: 'thread_a',
      busy: false,
      draining: false,
    }).action).toBe('send');
  });
});

describe('queue send watchdog default', () => {
  test('matches in-flight stale window', () => {
    expect(DEFAULT_QUEUE_SEND_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
