import { describe, expect, test } from 'bun:test';
import { planQueueDrain } from './queue-drain';
import type { QueueItem } from './queue-storage';

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
});
