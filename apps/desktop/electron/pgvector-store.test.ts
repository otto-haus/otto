import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PGVECTOR_SCHEMA_COMMENT,
  PgvectorStore,
  chunkText,
  embedTextLocal,
  pgvectorEnabled,
  sha256Text,
} from './pgvector-store';

class ReadyPgvectorStore extends PgvectorStore {
  override async healthCheck() {
    return {
      enabled: true,
      available: true,
      state: 'ready' as const,
      connectionHint: 'postgresql://nobody:nobody@127.0.0.1:15999/none',
      lastCheckedAt: new Date(0).toISOString(),
      lastIndexedAt: null,
      note: 'ready',
      error: null,
    };
  }
}

class UnexpectedHealthPgvectorStore extends PgvectorStore {
  override async healthCheck() {
    throw new Error('healthCheck should not run before source path validation');
  }
}

describe('PgvectorStore helpers', () => {
  test('disabled by default', () => {
    const prev = process.env.OTTO_PGVECTOR;
    delete process.env.OTTO_PGVECTOR;
    expect(pgvectorEnabled()).toBe(false);
    if (prev !== undefined) process.env.OTTO_PGVECTOR = prev;
  });

  test('schema comment documents provenance table', () => {
    expect(PGVECTOR_SCHEMA_COMMENT).toContain('provenance');
  });

  test('chunkText splits paragraphs', () => {
    const chunks = chunkText('alpha\n\nbeta\n\ngamma');
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join(' ')).toContain('alpha');
  });

  test('embedTextLocal is deterministic', () => {
    const a = embedTextLocal('model routing assumptions', 8);
    const b = embedTextLocal('model routing assumptions', 8);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
  });

  test('sha256Text hashes content', () => {
    expect(sha256Text('x')).toHaveLength(64);
  });
});

describe('PgvectorStore status', () => {
  test('disabled status without postgres', async () => {
    const prev = process.env.OTTO_PGVECTOR;
    delete process.env.OTTO_PGVECTOR;
    const status = await new PgvectorStore().status();
    expect(status.enabled).toBe(false);
    expect(status.available).toBe(false);
    expect(status.state).toBe('disabled');
    expect(status.connectionHint).toBeNull();
    expect(status.note).toContain('docs/pgvector.md');
    if (prev !== undefined) process.env.OTTO_PGVECTOR = prev;
  });

  test('enabled without live postgres reports stopped or error', async () => {
    const prevPg = process.env.OTTO_PGVECTOR;
    const prevUrl = process.env.OTTO_PGVECTOR_URL;
    process.env.OTTO_PGVECTOR = '1';
    process.env.OTTO_PGVECTOR_URL = 'postgresql://nobody:nobody@127.0.0.1:15999/none';
    const store = new PgvectorStore();
    const status = await store.status();
    expect(status.enabled).toBe(true);
    expect(status.available).toBe(false);
    expect(['stopped', 'error', 'starting']).toContain(status.state);
    expect(status.connectionHint).toContain('15999');
    await store.disconnect();
    if (prevPg !== undefined) process.env.OTTO_PGVECTOR = prevPg;
    else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR');
    if (prevUrl !== undefined) process.env.OTTO_PGVECTOR_URL = prevUrl;
    else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR_URL');
  });

  test('indexSource rejects source paths outside the repo root before connecting', async () => {
    const prevPg = process.env.OTTO_PGVECTOR;
    const prevUrl = process.env.OTTO_PGVECTOR_URL;
    process.env.OTTO_PGVECTOR = '1';
    process.env.OTTO_PGVECTOR_URL = 'postgresql://nobody:nobody@127.0.0.1:15999/none';
    const dir = mkdtempSync(join(tmpdir(), 'otto-pgvector-path-'));
    try {
      const store = new UnexpectedHealthPgvectorStore();
      let message = '';
      try {
        await store.indexSource('../outside.md', 'fixture', { root: dir, text: 'outside' });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toMatch(/sourcePath must stay within root/i);
      await store.disconnect();
    } finally {
      rmSync(dir, { recursive: true, force: true });
      if (prevPg !== undefined) process.env.OTTO_PGVECTOR = prevPg;
      else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR');
      if (prevUrl !== undefined) process.env.OTTO_PGVECTOR_URL = prevUrl;
      else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR_URL');
    }
  });

  test('indexSource rejects symlinked source paths that resolve outside the repo root before connecting', async () => {
    const prevPg = process.env.OTTO_PGVECTOR;
    const prevUrl = process.env.OTTO_PGVECTOR_URL;
    process.env.OTTO_PGVECTOR = '1';
    process.env.OTTO_PGVECTOR_URL = 'postgresql://nobody:nobody@127.0.0.1:15999/none';
    const dir = mkdtempSync(join(tmpdir(), 'otto-pgvector-symlink-root-'));
    const outside = mkdtempSync(join(tmpdir(), 'otto-pgvector-symlink-outside-'));
    try {
      mkdirSync(join(dir, 'fixture'), { recursive: true });
      const outsidePath = join(outside, 'secret.md');
      writeFileSync(outsidePath, 'outside root', 'utf8');
      symlinkSync(outsidePath, join(dir, 'fixture', 'secret.md'));

      const store = new UnexpectedHealthPgvectorStore();
      let message = '';
      try {
        await store.indexSource('fixture/secret.md', 'fixture', { root: dir });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toMatch(/sourcePath must stay within root/i);
      await store.disconnect();
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
      if (prevPg !== undefined) process.env.OTTO_PGVECTOR = prevPg;
      else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR');
      if (prevUrl !== undefined) process.env.OTTO_PGVECTOR_URL = prevUrl;
      else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR_URL');
    }
  });
});

const integrationEnabled = process.env.OTTO_PGVECTOR_INTEGRATION === '1';

(integrationEnabled ? describe : describe.skip)('PgvectorStore integration', () => {
  test('indexSource is idempotent and query returns provenance', async () => {
    const prevPg = process.env.OTTO_PGVECTOR;
    const prevUrl = process.env.OTTO_PGVECTOR_URL;
    const prevRoot = process.env.OTTO_ROOT;
    process.env.OTTO_PGVECTOR = '1';
    process.env.OTTO_PGVECTOR_URL = process.env.OTTO_PGVECTOR_URL ?? 'postgresql://otto:otto@127.0.0.1:5433/otto_recall';

    const dir = mkdtempSync(join(tmpdir(), 'otto-pgvector-fix-'));
    const rel = 'fixture/pgvector-sample.md';
    const abs = join(dir, rel);
    mkdirSync(join(dir, 'fixture'), { recursive: true });
    writeFileSync(abs, '# Sample\n\nmodel routing assumptions for local recall.\n', 'utf8');
    process.env.OTTO_ROOT = dir;

    const store = new PgvectorStore();
    const health = await store.healthCheck();
    expect(health.available).toBe(true);

    const first = await store.indexSource(rel, 'fixture', { text: '# Sample\n\nmodel routing assumptions for local recall.\n' });
    const second = await store.indexSource(rel, 'fixture', { text: '# Sample\n\nmodel routing assumptions for local recall.\n' });
    expect(first.chunksWritten).toBeGreaterThan(0);
    expect(second.chunksWritten).toBe(first.chunksWritten);

    const result = await store.query('model routing');
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits[0]?.sourcePath).toBe(rel);
    expect(result.hits[0]?.contentHash).toBe(first.contentHash);
    expect(result.hits[0]?.score).toBeGreaterThan(0);

    await store.disconnect();
    if (prevPg !== undefined) process.env.OTTO_PGVECTOR = prevPg;
    else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR');
    if (prevUrl !== undefined) process.env.OTTO_PGVECTOR_URL = prevUrl;
    else Reflect.deleteProperty(process.env, 'OTTO_PGVECTOR_URL');
    if (prevRoot !== undefined) process.env.OTTO_ROOT = prevRoot;
    else Reflect.deleteProperty(process.env, 'OTTO_ROOT');
  });
});
