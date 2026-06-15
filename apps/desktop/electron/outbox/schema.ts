import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Durable chat outbox schema (#754). Source of truth lives in the Electron MAIN process
 * (SQLite, WAL), never the renderer. Drizzle keeps the schema + typed queries driver-agnostic:
 * production binds the `better-sqlite3` driver (Electron ABI), tests bind `bun:sqlite`.
 *
 * Lifecycle states:
 *   queued      durable row waiting for the pump to drain (created BEFORE Letta is touched)
 *   sending     handed to the runtime; turn accepted/in progress
 *   streaming   runtime is streaming tokens/tool events back
 *   sent        runtime accepted + completed the turn
 *   failed      send rejected; error_code preserved; retryable until attempt_count >= max_attempts
 *   blocked     runtime unavailable / usage limit — NOT failed, NOT silent loss; retry after change
 *   cancelled   user cleared the queue or recalled the row (soft; not hard-deleted immediately)
 *   interrupted crash/restart left this row mid-flight; recovered on next launch (not lost)
 */
export const QUEUE_STATES = [
  'queued',
  'sending',
  'streaming',
  'sent',
  'failed',
  'blocked',
  'cancelled',
  'interrupted',
] as const;
export type QueueState = (typeof QUEUE_STATES)[number];

/** States that the pump may pick up to (re)drain. */
export const DRAINABLE_STATES: QueueState[] = ['queued'];
/** In-flight states that crash-recovery rewrites to `interrupted` on launch. */
export const INFLIGHT_STATES: QueueState[] = ['sending', 'streaming'];
/** States eligible for retry / retry-all. */
export const RETRYABLE_STATES: QueueState[] = ['failed', 'interrupted', 'blocked'];

/** Turn-event types — compatible with TurnTrail (#727: thought|tool|checkpoint) plus outbox lifecycle. */
export const TURN_EVENT_TYPES = [
  'thought',
  'tool',
  'checkpoint',
  'token',
  'error',
  'receipt',
] as const;
export type TurnEventType = (typeof TURN_EVENT_TYPES)[number];

export const queueItems = sqliteTable(
  'queue_items',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id').notNull(),
    clientMessageId: text('client_message_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    text: text('text').notNull(),
    attachmentsJson: text('attachments_json'),
    model: text('model'),
    effort: text('effort'),
    state: text('state').$type<QueueState>().notNull(),
    priority: integer('priority').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    nextAttemptAt: integer('next_attempt_at'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    startedAt: integer('started_at'),
    finishedAt: integer('finished_at'),
  },
  (table) => ({
    idempotencyKeyUnique: uniqueIndex('queue_items_idempotency_key_unique').on(table.idempotencyKey),
    threadStateIdx: index('queue_items_thread_state_idx').on(table.threadId, table.state),
    stateCreatedIdx: index('queue_items_state_created_idx').on(table.state, table.createdAt),
  }),
);

export const turnEvents = sqliteTable(
  'turn_events',
  {
    id: text('id').primaryKey(),
    queueItemId: text('queue_item_id').notNull(),
    /** Logical turn id (== queueItemId for outbox turns); kept distinct for TurnTrail (#727) reuse. */
    turnId: text('turn_id').notNull(),
    threadId: text('thread_id').notNull(),
    parentId: text('parent_id'),
    seq: integer('seq').notNull(),
    type: text('type').$type<TurnEventType>().notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    /** Small structured payload (JSON). Large payloads stay out of the DOM via payloadRef. */
    payloadJson: text('payload_json'),
    payloadRef: text('payload_ref'),
    createdAt: integer('created_at').notNull(),
    startedAt: integer('started_at'),
    endedAt: integer('ended_at'),
  },
  (table) => ({
    queueItemSeqIdx: index('turn_events_queue_item_seq_idx').on(table.queueItemId, table.seq),
    threadSeqIdx: index('turn_events_thread_seq_idx').on(table.threadId, table.seq),
  }),
);

export type QueueItemRow = typeof queueItems.$inferSelect;
export type QueueItemInsert = typeof queueItems.$inferInsert;
export type TurnEventRow = typeof turnEvents.$inferSelect;
export type TurnEventInsert = typeof turnEvents.$inferInsert;
