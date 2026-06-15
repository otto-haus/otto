import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'node:crypto';
import {
  INFLIGHT_STATES,
  queueItems,
  turnEvents,
  type QueueItemRow,
  type QueueState,
  type TurnEventInsert,
  type TurnEventRow,
  type TurnEventType,
} from './schema';
import { redactAttachments, redactText, type OutboxAttachmentRef } from './redaction';

/**
 * Any synchronous SQLite-backed drizzle instance. Production binds `better-sqlite3` (Electron
 * ABI); tests bind `bun:sqlite`. Both extend `BaseSQLiteDatabase<'sync', ...>`, so the store's
 * logic is identical and fully unit-testable without the native module.
 */
// biome-ignore lint/suspicious/noExplicitAny: a generic DB handle that accepts either sync driver.
export type OutboxDb = BaseSQLiteDatabase<'sync', any, any>;

export type EnqueueInput = {
  threadId: string;
  text: string;
  clientMessageId?: string;
  /** Stable key that prevents duplicate work on double-click/double-send. Derived if omitted. */
  idempotencyKey?: string;
  attachments?: OutboxAttachmentRef[] | null;
  model?: string | null;
  effort?: string | null;
  priority?: number;
  maxAttempts?: number;
};

export type FailureInput = { errorCode: string; errorMessage?: string };

export type StoreOptions = { now?: () => number; genId?: () => string };

export type QueueItemDetail = QueueItemRow & {
  attachments: OutboxAttachmentRef[];
  turnEvents: TurnEventRow[];
};

const NON_TERMINAL_STATES: QueueState[] = ['queued', 'sending', 'streaming', 'failed', 'blocked', 'interrupted'];

/**
 * Durable outbox store. Pure, synchronous, driver-agnostic. Holds NO renderer state and stores
 * NO secrets/raw paths (everything is redacted on the way in).
 */
export class OutboxStore {
  private readonly now: () => number;
  private readonly genId: () => string;

  constructor(private readonly db: OutboxDb, opts: StoreOptions = {}) {
    this.now = opts.now ?? (() => Date.now());
    this.genId = opts.genId ?? (() => randomUUID());
  }

  /**
   * Create a durable `queued` row BEFORE Letta is touched. Idempotent on idempotencyKey:
   * a duplicate click/send returns the existing row instead of doing the work twice.
   */
  enqueue(input: EnqueueInput): { item: QueueItemRow; duplicate: boolean } {
    const clientMessageId = input.clientMessageId ?? this.genId();
    const idempotencyKey = input.idempotencyKey ?? `${input.threadId}:${clientMessageId}`;

    const existing = this.db
      .select()
      .from(queueItems)
      .where(eq(queueItems.idempotencyKey, idempotencyKey))
      .all() as QueueItemRow[];
    if (existing.length > 0) return { item: existing[0], duplicate: true };

    const ts = this.now();
    const attachmentsJson = input.attachments?.length
      ? JSON.stringify(redactAttachments(input.attachments))
      : null;
    const row = {
      id: this.genId(),
      threadId: input.threadId,
      clientMessageId,
      idempotencyKey,
      text: redactText(input.text),
      attachmentsJson,
      model: input.model ?? null,
      effort: input.effort ?? null,
      state: 'queued' as QueueState,
      priority: input.priority ?? 0,
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? 3,
      nextAttemptAt: null,
      errorCode: null,
      errorMessage: null,
      createdAt: ts,
      updatedAt: ts,
      startedAt: null,
      finishedAt: null,
    } satisfies QueueItemRow;

    this.db.insert(queueItems).values(row).run();
    return { item: row, duplicate: false };
  }

  get(id: string): QueueItemRow | null {
    const rows = this.db.select().from(queueItems).where(eq(queueItems.id, id)).all() as QueueItemRow[];
    return rows[0] ?? null;
  }

  detail(id: string): QueueItemDetail | null {
    const item = this.get(id);
    if (!item) return null;
    return {
      ...item,
      attachments: parseAttachments(item.attachmentsJson),
      turnEvents: this.listTurnEvents(id),
    };
  }

  /** All rows for a thread (or all threads when threadId is omitted), newest first. */
  list(threadId?: string | null): QueueItemRow[] {
    const query = this.db.select().from(queueItems);
    const rows = (
      threadId ? query.where(eq(queueItems.threadId, threadId)).all() : query.all()
    ) as QueueItemRow[];
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  }

  /** Rows the operator should still see in the banner (everything except sent/cancelled). */
  visible(threadId?: string | null): QueueItemRow[] {
    return this.list(threadId).filter((r) => r.state !== 'sent' && r.state !== 'cancelled');
  }

  /** Oldest `queued` row for a thread (FIFO, priority-weighted). The pump drains this. */
  nextQueued(threadId?: string | null): QueueItemRow | null {
    const base = this.db.select().from(queueItems);
    const rows = (
      threadId
        ? base.where(and(eq(queueItems.state, 'queued'), eq(queueItems.threadId, threadId)))
        : base.where(eq(queueItems.state, 'queued'))
    )
      .orderBy(desc(queueItems.priority), asc(queueItems.createdAt))
      .all() as QueueItemRow[];
    return rows[0] ?? null;
  }

  private patch(id: string, patch: Partial<QueueItemRow>): QueueItemRow | null {
    this.db
      .update(queueItems)
      .set({ ...patch, updatedAt: this.now() })
      .where(eq(queueItems.id, id))
      .run();
    return this.get(id);
  }

  /** Mark an attempt as started. Increments attempt_count — this IS the attempt counter. */
  markSending(id: string): QueueItemRow | null {
    const current = this.get(id);
    if (!current) return null;
    return this.patch(id, {
      state: 'sending',
      attemptCount: current.attemptCount + 1,
      startedAt: current.startedAt ?? this.now(),
      errorCode: null,
      errorMessage: null,
    });
  }

  markStreaming(id: string): QueueItemRow | null {
    return this.patch(id, { state: 'streaming' });
  }

  markSent(id: string): QueueItemRow | null {
    return this.patch(id, { state: 'sent', finishedAt: this.now(), errorCode: null, errorMessage: null });
  }

  /** Hard failure with a preserved error_code (retryable until attempt_count >= max_attempts). */
  markFailed(id: string, failure: FailureInput): QueueItemRow | null {
    return this.patch(id, {
      state: 'failed',
      errorCode: failure.errorCode,
      errorMessage: failure.errorMessage ? redactText(failure.errorMessage) : null,
      finishedAt: this.now(),
    });
  }

  /** Runtime unavailable / usage limit. NOT failed, NOT silent loss — retry after the change. */
  markBlocked(id: string, failure: FailureInput): QueueItemRow | null {
    return this.patch(id, {
      state: 'blocked',
      errorCode: failure.errorCode,
      errorMessage: failure.errorMessage ? redactText(failure.errorMessage) : null,
    });
  }

  /** Retry a single row (failed/interrupted/blocked) → re-queue the same row. */
  retry(id: string): QueueItemRow | null {
    const current = this.get(id);
    if (!current) return null;
    if (current.state !== 'failed' && current.state !== 'interrupted' && current.state !== 'blocked') {
      return current;
    }
    return this.patch(id, { state: 'queued', errorCode: null, errorMessage: null, nextAttemptAt: null, finishedAt: null });
  }

  /** Retry-all: only failed/interrupted rows, oldest first. (Blocked is retried individually.) */
  retryAll(threadId?: string | null): QueueItemRow[] {
    const targets = this.list(threadId)
      .filter((r) => r.state === 'failed' || r.state === 'interrupted')
      .sort((a, b) => a.createdAt - b.createdAt);
    const out: QueueItemRow[] = [];
    for (const row of targets) {
      const next = this.patch(row.id, {
        state: 'queued',
        errorCode: null,
        errorMessage: null,
        nextAttemptAt: null,
        finishedAt: null,
      });
      if (next) out.push(next);
    }
    return out;
  }

  /**
   * Recall: copy the (redacted) text back to the composer and soft-cancel the original row.
   * Returns the text/attachments for the renderer to rehydrate the composer.
   */
  recall(id: string): { text: string; attachments: OutboxAttachmentRef[] } | null {
    const current = this.get(id);
    if (!current) return null;
    this.patch(id, { state: 'cancelled', errorCode: 'recalled', finishedAt: this.now() });
    return { text: current.text, attachments: parseAttachments(current.attachmentsJson) };
  }

  /** Soft-cancel a single row (used by per-item remove). Does NOT hard-delete. */
  cancel(id: string): QueueItemRow | null {
    const current = this.get(id);
    if (!current) return null;
    return this.patch(id, { state: 'cancelled', finishedAt: this.now() });
  }

  /** Clear queue: soft-cancel every non-terminal row. Does NOT hard-delete immediately. */
  clear(threadId?: string | null): number {
    const targets = this.list(threadId).filter((r) => NON_TERMINAL_STATES.includes(r.state));
    for (const row of targets) {
      this.patch(row.id, { state: 'cancelled', finishedAt: this.now() });
    }
    return targets.length;
  }

  /**
   * Crash recovery: any row left `sending`/`streaming` by a crash becomes `interrupted` on the
   * next launch (never silently lost). Returns the recovered rows.
   */
  recoverInterrupted(): QueueItemRow[] {
    const inflight = this.db
      .select()
      .from(queueItems)
      .where(inArray(queueItems.state, INFLIGHT_STATES))
      .all() as QueueItemRow[];
    for (const row of inflight) {
      this.patch(row.id, {
        state: 'interrupted',
        errorCode: row.errorCode ?? 'interrupted_on_restart',
        errorMessage: row.errorMessage ?? 'otto restarted while this message was still in flight.',
      });
    }
    return inflight.map((r) => this.get(r.id)).filter((r): r is QueueItemRow => r != null);
  }

  // ── turn_events ───────────────────────────────────────────────────────────

  private nextSeq(queueItemId: string): number {
    const rows = this.db
      .select()
      .from(turnEvents)
      .where(eq(turnEvents.queueItemId, queueItemId))
      .all() as TurnEventRow[];
    return rows.reduce((max, e) => Math.max(max, e.seq), -1) + 1;
  }

  appendTurnEvent(input: {
    queueItemId: string;
    threadId: string;
    type: TurnEventType;
    status: string;
    title: string;
    body?: string | null;
    payload?: unknown;
    payloadRef?: string | null;
    parentId?: string | null;
    startedAt?: number | null;
    endedAt?: number | null;
  }): TurnEventRow {
    const ts = this.now();
    const row: TurnEventInsert = {
      id: this.genId(),
      queueItemId: input.queueItemId,
      turnId: input.queueItemId,
      threadId: input.threadId,
      parentId: input.parentId ?? null,
      seq: this.nextSeq(input.queueItemId),
      type: input.type,
      status: input.status,
      title: redactText(input.title).slice(0, 500),
      body: input.body != null ? redactText(String(input.body)) : null,
      payloadJson: input.payload != null ? redactText(JSON.stringify(input.payload)) : null,
      payloadRef: input.payloadRef ?? null,
      createdAt: ts,
      startedAt: input.startedAt ?? null,
      endedAt: input.endedAt ?? null,
    };
    this.db.insert(turnEvents).values(row).run();
    return row as TurnEventRow;
  }

  listTurnEvents(queueItemId: string): TurnEventRow[] {
    return (
      this.db
        .select()
        .from(turnEvents)
        .where(eq(turnEvents.queueItemId, queueItemId))
        .orderBy(asc(turnEvents.seq))
        .all() as TurnEventRow[]
    );
  }
}

export function parseAttachments(json: string | null): OutboxAttachmentRef[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
      .map((a) => ({
        name: String(a.name ?? ''),
        ...(a.path ? { path: String(a.path) } : {}),
        ...(a.mime ? { mime: String(a.mime) } : {}),
      }));
  } catch {
    return [];
  }
}
