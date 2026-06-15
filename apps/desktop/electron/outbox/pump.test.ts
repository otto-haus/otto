import { describe, expect, test } from 'bun:test';
import { QueuePump, type RuntimeSendPort } from './pump';
import { createTestOutboxDb } from './testing';

const THREAD = 'thread-a';

function mockPort(opts: {
  ready?: boolean;
  code?: string | null;
  reason?: string | null;
  behavior?: (text: string) => Promise<void>;
}): RuntimeSendPort & { sends: string[] } {
  const sends: string[] = [];
  return {
    sends,
    getStatus: () => ({ ready: opts.ready ?? true, code: opts.code ?? null, reason: opts.reason ?? null }),
    async send(text, hooks) {
      sends.push(text);
      hooks?.onStreaming?.();
      if (opts.behavior) await opts.behavior(text);
    },
  };
}

describe('QueuePump drain (concurrency 1)', () => {
  test('drains queued rows oldest-first and marks them sent', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({});
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'first' }).item;
    const b = store.enqueue({ threadId: THREAD, text: 'second' }).item;

    pump.schedule(THREAD);
    await pump.onIdle();

    expect(port.sends).toEqual(['first', 'second']);
    expect(store.get(a.id)!.state).toBe('sent');
    expect(store.get(b.id)!.state).toBe('sent');
  });

  test('passes through the streaming state before sent', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({});
    const states: string[] = [];
    const pump = new QueuePump(store, port, {
      onChange: () => {
        const row = store.list(THREAD)[0];
        if (row) states.push(row.state);
      },
    });
    store.enqueue({ threadId: THREAD, text: 'go' });
    pump.schedule(THREAD);
    await pump.onIdle();
    expect(states).toContain('sending');
    expect(states).toContain('streaming');
    expect(states[states.length - 1]).toBe('sent');
  });

  test('runtime unavailable → row blocked with error_code, never sent', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({ ready: false, code: 'unreachable', reason: 'Letta not running' });
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'go' }).item;

    pump.schedule(THREAD);
    await pump.onIdle();

    expect(port.sends).toHaveLength(0);
    const row = store.get(a.id)!;
    expect(row.state).toBe('blocked');
    expect(row.errorCode).toBe('runtime_unavailable');
  });

  test('usage limit → row blocked with usage_limit code', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({ ready: false, code: 'usage-limit', reason: 'over quota' });
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'go' }).item;
    pump.schedule(THREAD);
    await pump.onIdle();
    expect(store.get(a.id)!.state).toBe('blocked');
    expect(store.get(a.id)!.errorCode).toBe('usage_limit');
  });

  test('thrown send error is preserved as failed with an honest error_code', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({
      behavior: async () => {
        throw new Error('Rate limit reached for model');
      },
    });
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'go' }).item;
    pump.schedule(THREAD);
    await pump.onIdle();
    const row = store.get(a.id)!;
    expect(row.state).toBe('failed');
    expect(row.errorCode).toBe('usage_limit');
    expect(row.attemptCount).toBe(1);
  });

  test('network loss during send → blocked (transient), not failed', async () => {
    const { store } = createTestOutboxDb();
    const port = mockPort({
      behavior: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:8283');
      },
    });
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'go' }).item;
    pump.schedule(THREAD);
    await pump.onIdle();
    expect(store.get(a.id)!.state).toBe('blocked');
    expect(store.get(a.id)!.errorCode).toBe('runtime_unavailable');
  });

  test('a failed row stops the pass; later queued rows are not auto-drained past it', async () => {
    const { store } = createTestOutboxDb();
    let calls = 0;
    const port = mockPort({
      behavior: async () => {
        calls += 1;
        throw new Error('boom');
      },
    });
    const pump = new QueuePump(store, port);
    store.enqueue({ threadId: THREAD, text: 'first' });
    store.enqueue({ threadId: THREAD, text: 'second' });
    pump.schedule(THREAD);
    await pump.onIdle();
    // Only the first item was attempted; pump halts on failure.
    expect(calls).toBe(1);
  });

  test('retry then re-schedule sends the same row again (attempt_count grows)', async () => {
    const { store } = createTestOutboxDb();
    let attempt = 0;
    const port = mockPort({
      behavior: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('transient boom please');
      },
    });
    const pump = new QueuePump(store, port);
    const a = store.enqueue({ threadId: THREAD, text: 'go' }).item;

    pump.schedule(THREAD);
    await pump.onIdle();
    expect(store.get(a.id)!.state).toBe('failed');

    store.retry(a.id);
    pump.schedule(THREAD);
    await pump.onIdle();

    expect(store.get(a.id)!.state).toBe('sent');
    expect(store.get(a.id)!.attemptCount).toBe(2);
  });
});
