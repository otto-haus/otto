import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import {
  toQueueItemView,
  toTurnEventView,
  type EnqueueRequest,
  type OutboxSnapshot,
  type QueueItemDetailView,
  type QueueItemView,
  type RecallResult,
} from './contract';
import { runOutboxMigrations, type RawSqliteClient } from './migrations';
import { QueuePump, type RuntimeSendPort } from './pump';
import { OutboxStore } from './store';

export type OutboxBroadcast = (snapshot: OutboxSnapshot) => void;

/**
 * Main-process owner of the durable outbox. Wires the durable store, the in-memory drain pump, and
 * the renderer broadcast into one facade. The renderer holds NO durable queue state — it subscribes
 * to the snapshots this service emits.
 */
export class OutboxService {
  private readonly pump: QueuePump;

  constructor(
    readonly store: OutboxStore,
    port: RuntimeSendPort,
    private readonly broadcast: OutboxBroadcast,
  ) {
    this.pump = new QueuePump(store, port, { onChange: (threadId) => this.emit(threadId) });
    // Crash recovery: any row left mid-flight by a crash becomes `interrupted` on launch.
    const recovered = this.store.recoverInterrupted();
    if (recovered.length) this.emit(recovered[0].threadId);
  }

  /** Production wiring: open SQLite (WAL) under the otto state dir with the native driver. */
  static open(opts: { dir: string; port: RuntimeSendPort; broadcast: OutboxBroadcast }): OutboxService {
    mkdirSync(opts.dir, { recursive: true });
    const dbPath = join(opts.dir, 'outbox.db');
    // Lazy require so the native module is only loaded inside Electron (never under bun/node tests).
    const require = createRequire(__filename);
    const DatabaseCtor = require('better-sqlite3') as typeof BetterSqlite3;
    const sqlite = new DatabaseCtor(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('busy_timeout = 5000');
    runOutboxMigrations(sqlite as unknown as RawSqliteClient);
    const db = drizzle(sqlite);
    const store = new OutboxStore(db);
    return new OutboxService(store, opts.port, opts.broadcast);
  }

  snapshot(threadId: string | null): OutboxSnapshot {
    const items = this.store.visible(threadId).map((row) => toQueueItemView(row));
    return { threadId: threadId ?? null, items, updatedAt: Date.now() };
  }

  private emit(threadId: string | null): void {
    this.broadcast(this.snapshot(threadId));
  }

  // ── IPC-facing operations ───────────────────────────────────────────────

  /** Durable enqueue: writes the queued row BEFORE Letta is touched, then schedules a drain. */
  enqueue(req: EnqueueRequest): QueueItemView {
    const { item } = this.store.enqueue({
      threadId: req.threadId,
      text: req.text,
      clientMessageId: req.clientMessageId,
      idempotencyKey: req.idempotencyKey,
      attachments: req.attachments,
      model: req.model ?? null,
      effort: req.effort ?? null,
      priority: req.priority,
      maxAttempts: req.maxAttempts,
    });
    this.pump.schedule(req.threadId);
    this.emit(req.threadId);
    return toQueueItemView(item);
  }

  list(threadId: string | null): QueueItemView[] {
    return this.store.visible(threadId).map((row) => toQueueItemView(row));
  }

  detail(id: string): QueueItemDetailView | null {
    const detail = this.store.detail(id);
    if (!detail) return null;
    return {
      ...toQueueItemView(detail, detail.attachments),
      turnEvents: detail.turnEvents.map(toTurnEventView),
    };
  }

  retry(id: string): QueueItemView | null {
    const row = this.store.retry(id);
    if (!row) return null;
    this.pump.schedule(row.threadId);
    this.emit(row.threadId);
    return toQueueItemView(row);
  }

  retryAll(threadId: string | null): QueueItemView[] {
    const rows = this.store.retryAll(threadId);
    if (threadId) this.pump.schedule(threadId);
    else for (const row of rows) this.pump.schedule(row.threadId);
    this.emit(threadId);
    return rows.map((row) => toQueueItemView(row));
  }

  recall(id: string): RecallResult | null {
    const row = this.store.get(id);
    const result = this.store.recall(id);
    if (!result) return null;
    if (row) this.emit(row.threadId);
    return {
      text: result.text,
      attachments: result.attachments.map((a) => ({
        name: a.name,
        ...(a.path ? { path: a.path } : {}),
        ...(a.mime ? { mime: a.mime } : {}),
      })),
    };
  }

  cancel(id: string): QueueItemView | null {
    const row = this.store.cancel(id);
    if (!row) return null;
    this.emit(row.threadId);
    return toQueueItemView(row);
  }

  clear(threadId: string | null): number {
    const count = this.store.clear(threadId);
    this.emit(threadId);
    return count;
  }

  /** Reschedule a drain (e.g. after the runtime becomes ready, to drain rows queued while blocked). */
  resume(threadId: string): void {
    this.pump.schedule(threadId);
  }

  /** Resolve when the drain pump is idle. Used by tests and graceful shutdown. */
  whenIdle(): Promise<void> {
    return this.pump.onIdle();
  }
}
