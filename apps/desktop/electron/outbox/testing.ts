/**
 * Test-only outbox DB factory. Binds Bun's built-in `bun:sqlite` so the FULL durable store can be
 * exercised under `bun test` without the `better-sqlite3` native module (which is built for the
 * Electron ABI and cannot load under plain node/bun). Production binds `better-sqlite3` instead —
 * the schema, migrations, and store logic are identical across both drivers.
 *
 * Excluded from electron:typecheck (it imports `bun:sqlite`); only ever imported by *.test.ts.
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { runOutboxMigrations, type RawSqliteClient } from './migrations';
import { OutboxStore, type StoreOptions } from './store';

export function createTestOutboxDb(opts: StoreOptions = {}) {
  const sqlite = new Database(':memory:');
  sqlite.exec('PRAGMA journal_mode = WAL;');
  runOutboxMigrations(sqlite as unknown as RawSqliteClient);
  const db = drizzle(sqlite);
  const store = new OutboxStore(db, opts);
  return { sqlite, db, store, close: () => sqlite.close() };
}
