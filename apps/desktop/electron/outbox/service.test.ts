import { describe, expect, test } from 'bun:test';
import { outboxSnapshotSchema, type OutboxSnapshot } from './contract';
import { OutboxService } from './service';
import type { RuntimeSendPort } from './pump';
import { createTestOutboxDb } from './testing';

const THREAD = 'thread-a';

function readyPort(): RuntimeSendPort {
  return { getStatus: () => ({ ready: true }), send: async () => {} };
}
function downPort(): RuntimeSendPort {
  return { getStatus: () => ({ ready: false, code: 'unreachable', reason: 'no runtime' }), send: async () => {} };
}

function capture() {
  const snapshots: OutboxSnapshot[] = [];
  return { snapshots, broadcast: (s: OutboxSnapshot) => snapshots.push(s) };
}

describe('OutboxService IPC surface', () => {
  test('enqueue is durable, emits a validated snapshot, and drains to empty on success', async () => {
    const { store } = createTestOutboxDb();
    const { snapshots, broadcast } = capture();
    const service = new OutboxService(store, readyPort(), broadcast);

    const view = service.enqueue({ threadId: THREAD, text: 'hello' });
    expect(view.state).toBe('queued');
    // First emit (right after enqueue) shows the queued item.
    expect(snapshots[0].items.some((i) => i.id === view.id)).toBe(true);
    // Every emitted snapshot validates against the Zod contract.
    for (const s of snapshots) expect(outboxSnapshotSchema.safeParse(s).success).toBe(true);

    await service.whenIdle();
    // Sent items leave the banner; the durable row is marked sent (not deleted).
    expect(service.list(THREAD)).toHaveLength(0);
    expect(store.get(view.id)!.state).toBe('sent');
  });

  test('enqueue with runtime down keeps the message as a blocked banner row (no silent loss)', async () => {
    const { store } = createTestOutboxDb();
    const { broadcast } = capture();
    const service = new OutboxService(store, downPort(), broadcast);
    const view = service.enqueue({ threadId: THREAD, text: 'hello' });
    await service.whenIdle();
    const list = service.list(THREAD);
    expect(list).toHaveLength(1);
    expect(list[0].state).toBe('blocked');
    expect(list[0].errorCode).toBe('runtime_unavailable');
    expect(store.get(view.id)!.text).toBe('hello');
  });

  test('duplicate enqueue (same idempotency key) does not double-send', async () => {
    const { store } = createTestOutboxDb();
    const sends: string[] = [];
    const port: RuntimeSendPort = { getStatus: () => ({ ready: true }), send: async (t) => { sends.push(t); } };
    const service = new OutboxService(store, port, () => {});
    service.enqueue({ threadId: THREAD, text: 'hi', idempotencyKey: 'k' });
    service.enqueue({ threadId: THREAD, text: 'hi', idempotencyKey: 'k' });
    await service.whenIdle();
    expect(sends).toEqual(['hi']);
  });

  test('recall returns composer text and clears the row from the banner', () => {
    const { store } = createTestOutboxDb();
    const service = new OutboxService(store, downPort(), () => {});
    const view = service.enqueue({ threadId: THREAD, text: 'draft me' });
    // (runtime down → stays blocked, still in banner)
    const recalled = service.recall(view.id);
    expect(recalled?.text).toBe('draft me');
    expect(service.list(THREAD)).toHaveLength(0);
  });

  test('clear soft-cancels the banner but detail/turn history survive', async () => {
    const { store } = createTestOutboxDb();
    const service = new OutboxService(store, downPort(), () => {});
    const view = service.enqueue({ threadId: THREAD, text: 'one' });
    await service.whenIdle();
    expect(service.clear(THREAD)).toBe(1);
    expect(service.list(THREAD)).toHaveLength(0);
    // The durable row + its turn events are still inspectable via detail.
    expect(service.detail(view.id)!.state).toBe('cancelled');
  });
});

describe('OutboxService crash recovery on restart', () => {
  test('a row left sending by a crash is recovered to interrupted when the service boots', () => {
    const { store } = createTestOutboxDb();
    const { item } = store.enqueue({ threadId: THREAD, text: 'mid-flight' });
    store.markSending(item.id); // simulate crash while sending (no markSent/markFailed)

    const { snapshots, broadcast } = capture();
    // Booting the service (simulating relaunch) runs crash recovery in its constructor.
    const service = new OutboxService(store, readyPort(), broadcast);
    const row = service.detail(item.id)!;
    expect(row.state).toBe('interrupted');
    expect(row.errorCode).toBe('interrupted_on_restart');
    expect(snapshots.length).toBeGreaterThan(0);
  });
});
