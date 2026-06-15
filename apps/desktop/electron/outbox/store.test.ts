import { describe, expect, test } from 'bun:test';
import { homedir } from 'node:os';
import { createTestOutboxDb } from './testing';

const THREAD = 'thread-a';

function seqId() {
  let n = 0;
  return () => `id-${(n += 1)}`;
}

describe('OutboxStore enqueue + idempotency', () => {
  test('enqueue creates a durable queued row before Letta is touched', () => {
    const { store } = createTestOutboxDb();
    const { item, duplicate } = store.enqueue({ threadId: THREAD, text: 'hello' });
    expect(duplicate).toBe(false);
    expect(item.state).toBe('queued');
    expect(item.attemptCount).toBe(0);
    expect(item.text).toBe('hello');
    expect(store.list(THREAD)).toHaveLength(1);
  });

  test('duplicate send with the same idempotency_key does not create duplicate work', () => {
    const { store } = createTestOutboxDb();
    const first = store.enqueue({ threadId: THREAD, text: 'hi', idempotencyKey: 'k1' });
    const second = store.enqueue({ threadId: THREAD, text: 'hi again', idempotencyKey: 'k1' });
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.item.id).toBe(first.item.id);
    expect(store.list(THREAD)).toHaveLength(1);
  });

  test('default idempotency key derives from thread + clientMessageId', () => {
    const { store } = createTestOutboxDb();
    const a = store.enqueue({ threadId: THREAD, text: 'x', clientMessageId: 'c1' });
    const b = store.enqueue({ threadId: THREAD, text: 'x', clientMessageId: 'c1' });
    expect(b.duplicate).toBe(true);
    expect(b.item.id).toBe(a.item.id);
  });
});

describe('OutboxStore lifecycle + attempts', () => {
  test('markSending increments attempt_count and records started_at', () => {
    const { store } = createTestOutboxDb();
    const { item } = store.enqueue({ threadId: THREAD, text: 'go' });
    const sending = store.markSending(item.id)!;
    expect(sending.state).toBe('sending');
    expect(sending.attemptCount).toBe(1);
    expect(sending.startedAt).not.toBeNull();
  });

  test('failed send preserves the exact error_code and is retryable', () => {
    const { store } = createTestOutboxDb();
    const { item } = store.enqueue({ threadId: THREAD, text: 'go' });
    store.markSending(item.id);
    const failed = store.markFailed(item.id, { errorCode: 'usage_limit', errorMessage: 'over quota' })!;
    expect(failed.state).toBe('failed');
    expect(failed.errorCode).toBe('usage_limit');

    const requeued = store.retry(item.id)!;
    expect(requeued.state).toBe('queued');
    expect(requeued.errorCode).toBeNull();

    // A second attempt increments the counter (retry → another attempt → attempt_count++).
    const sendingAgain = store.markSending(item.id)!;
    expect(sendingAgain.attemptCount).toBe(2);
  });

  test('runtime unavailable → blocked (not failed, not silent loss)', () => {
    const { store } = createTestOutboxDb();
    const { item } = store.enqueue({ threadId: THREAD, text: 'go' });
    const blocked = store.markBlocked(item.id, { errorCode: 'runtime_unavailable', errorMessage: 'no runtime' })!;
    expect(blocked.state).toBe('blocked');
    expect(blocked.errorCode).toBe('runtime_unavailable');
    // Blocked rows remain visible in the banner (not dropped).
    expect(store.visible(THREAD).some((r) => r.id === item.id)).toBe(true);
  });
});

describe('OutboxStore retry-all / recall / clear', () => {
  test('retry-all re-queues only failed/interrupted rows, oldest first', () => {
    const { store } = createTestOutboxDb({ now: stepClock() });
    const a = store.enqueue({ threadId: THREAD, text: 'a' }).item;
    const b = store.enqueue({ threadId: THREAD, text: 'b' }).item;
    const c = store.enqueue({ threadId: THREAD, text: 'c' }).item;
    const d = store.enqueue({ threadId: THREAD, text: 'd' }).item;

    store.markFailed(a.id, { errorCode: 'e' });
    store.markBlocked(b.id, { errorCode: 'runtime_unavailable' }); // excluded from retry-all
    // c stays queued (excluded)
    store.markSending(d.id);
    store.recoverInterrupted(); // d → interrupted (included)

    const requeued = store.retryAll(THREAD);
    const ids = requeued.map((r) => r.id);
    expect(ids).toEqual([a.id, d.id]); // oldest first, only failed/interrupted
    expect(store.get(b.id)!.state).toBe('blocked');
    expect(store.get(c.id)!.state).toBe('queued');
  });

  test('recall returns the text for the composer and soft-cancels the original row', () => {
    const { store } = createTestOutboxDb();
    const { item } = store.enqueue({ threadId: THREAD, text: 'recall me' });
    const recalled = store.recall(item.id)!;
    expect(recalled.text).toBe('recall me');
    expect(store.get(item.id)!.state).toBe('cancelled');
    expect(store.get(item.id)!.errorCode).toBe('recalled');
  });

  test('clear soft-cancels non-terminal rows but does NOT hard-delete them', () => {
    const { store } = createTestOutboxDb();
    const a = store.enqueue({ threadId: THREAD, text: 'a' }).item;
    const b = store.enqueue({ threadId: THREAD, text: 'b' }).item;
    store.markFailed(b.id, { errorCode: 'e' });

    const cleared = store.clear(THREAD);
    expect(cleared).toBe(2);
    // Rows still exist (not deleted), just cancelled.
    expect(store.get(a.id)!.state).toBe('cancelled');
    expect(store.get(b.id)!.state).toBe('cancelled');
    expect(store.list(THREAD)).toHaveLength(2);
    expect(store.visible(THREAD)).toHaveLength(0);
  });
});

describe('OutboxStore crash recovery', () => {
  test('sending/streaming rows become interrupted on next launch (not lost)', () => {
    const { store } = createTestOutboxDb();
    const a = store.enqueue({ threadId: THREAD, text: 'a' }).item;
    const b = store.enqueue({ threadId: THREAD, text: 'b' }).item;
    const c = store.enqueue({ threadId: THREAD, text: 'c' }).item;
    store.markSending(a.id);
    store.markSending(b.id);
    store.markStreaming(b.id);
    // c stays queued

    const recovered = store.recoverInterrupted();
    expect(recovered.map((r) => r.id).sort()).toEqual([a.id, b.id].sort());
    expect(store.get(a.id)!.state).toBe('interrupted');
    expect(store.get(b.id)!.state).toBe('interrupted');
    expect(store.get(c.id)!.state).toBe('queued');
    expect(store.get(a.id)!.errorCode).toBe('interrupted_on_restart');
  });
});

describe('OutboxStore turn_events', () => {
  test('appends ordered turn events with monotonic seq', () => {
    const { store } = createTestOutboxDb({ genId: seqId() });
    const { item } = store.enqueue({ threadId: THREAD, text: 'go' });
    store.appendTurnEvent({ queueItemId: item.id, threadId: THREAD, type: 'checkpoint', status: 'started', title: 'send' });
    store.appendTurnEvent({ queueItemId: item.id, threadId: THREAD, type: 'thought', status: 'running', title: 'thinking' });
    store.appendTurnEvent({ queueItemId: item.id, threadId: THREAD, type: 'receipt', status: 'done', title: 'sent' });
    const events = store.listTurnEvents(item.id);
    expect(events.map((e) => e.seq)).toEqual([0, 1, 2]);
    expect(events.map((e) => e.type)).toEqual(['checkpoint', 'thought', 'receipt']);
    expect(events[0].turnId).toBe(item.id);
  });
});

describe('OutboxStore redaction', () => {
  test('redacts provider keys and home paths before persisting', () => {
    const { store } = createTestOutboxDb();
    const home = homedir();
    const secret = 'sk-ant-0123456789abcdefghijklmnop';
    const { item } = store.enqueue({
      threadId: THREAD,
      text: `my key is ${secret} and file ${home}/secrets/notes.txt`,
    });
    expect(item.text).not.toContain(secret);
    expect(item.text).toContain('[redacted-secret]');
    expect(item.text).not.toContain(home);
    expect(item.text).toContain('~/secrets/notes.txt');
  });

  test('redacts attachment absolute paths', () => {
    const { store } = createTestOutboxDb();
    const home = homedir();
    const { item } = store.enqueue({
      threadId: THREAD,
      text: 'see attachment',
      attachments: [{ name: 'note.png', path: `${home}/Pictures/note.png`, mime: 'image/png' }],
    });
    const detail = store.detail(item.id)!;
    expect(detail.attachments[0].path).toBe('~/Pictures/note.png');
    expect(detail.attachments[0].name).toBe('note.png');
  });
});

function stepClock() {
  let t = 1_000;
  return () => (t += 1);
}
