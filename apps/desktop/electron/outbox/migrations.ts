/**
 * Hand-authored, append-only migrations for the durable outbox DB.
 *
 * We run DDL through the raw SQLite client's `.exec()` (present on both `better-sqlite3` and
 * `bun:sqlite`) and track applied ids in `__outbox_migrations`. This keeps migrations identical
 * across the production driver and the test driver without a runtime dependency on drizzle-kit.
 *
 * NEVER edit or reorder an existing migration once shipped — append a new one. This table is a
 * one-way door (the queue is durable user state).
 */
export type RawSqliteClient = {
  exec(sql: string): unknown;
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown;
  };
};

export type OutboxMigration = { id: string };

export const OUTBOX_MIGRATIONS: OutboxMigration[] = [{ id: '0000_init' }];

const MIGRATION_0000_INIT = `
CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  client_message_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  text TEXT NOT NULL,
  attachments_json TEXT,
  model TEXT,
  effort TEXT,
  state TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at INTEGER,
  error_code TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  started_at INTEGER,
  finished_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS queue_items_idempotency_key_unique ON queue_items (idempotency_key);
CREATE INDEX IF NOT EXISTS queue_items_thread_state_idx ON queue_items (thread_id, state);
CREATE INDEX IF NOT EXISTS queue_items_state_created_idx ON queue_items (state, created_at);

CREATE TABLE IF NOT EXISTS turn_events (
  id TEXT PRIMARY KEY,
  queue_item_id TEXT NOT NULL,
  turn_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  parent_id TEXT,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload_json TEXT,
  payload_ref TEXT,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS turn_events_queue_item_seq_idx ON turn_events (queue_item_id, seq);
CREATE INDEX IF NOT EXISTS turn_events_thread_seq_idx ON turn_events (thread_id, seq);
`;

function applyMigration(client: RawSqliteClient, migrationId: string): void {
  switch (migrationId) {
    case '0000_init':
      client.exec(MIGRATION_0000_INIT);
      return;
    default:
      throw new Error(`Unknown outbox migration: ${migrationId}`);
  }
}

/** Apply any pending migrations. Idempotent; safe to call on every open. */
export function runOutboxMigrations(client: RawSqliteClient): { applied: string[] } {
  client.exec(
    'CREATE TABLE IF NOT EXISTS __outbox_migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)',
  );
  const applied: string[] = [];
  for (const migration of OUTBOX_MIGRATIONS) {
    const row = client.prepare('SELECT id FROM __outbox_migrations WHERE id = ?').get(migration.id);
    if (row) continue;
    applyMigration(client, migration.id);
    client
      .prepare('INSERT INTO __outbox_migrations (id, applied_at) VALUES (?, ?)')
      .run(migration.id, Date.now());
    applied.push(migration.id);
  }
  return { applied };
}
