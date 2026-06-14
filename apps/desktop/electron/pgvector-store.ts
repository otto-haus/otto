import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { ISO8601 } from '@otto-haus/core';
import pg from 'pg';

export type PgvectorLifecycle = 'disabled' | 'stopped' | 'starting' | 'ready' | 'error';

export type PgvectorStatus = {
  enabled: boolean;
  available: boolean;
  state: PgvectorLifecycle;
  connectionHint: string | null;
  lastCheckedAt: ISO8601;
  lastIndexedAt: ISO8601 | null;
  note: string;
  error: string | null;
};

export type PgvectorSourceKind = 'standard' | 'receipt' | 'charter' | 'ticket' | 'knowledge' | 'practice' | 'fixture';

export type PgvectorIndexResult = {
  sourcePath: string;
  sourceKind: PgvectorSourceKind;
  chunksWritten: number;
  contentHash: string;
  embeddingModel: string;
};

export type PgvectorQueryHit = {
  id: string;
  sourceKind: string;
  sourcePath: string;
  contentHash: string;
  chunkIndex: number;
  snippet: string;
  score: number;
  embeddingModel: string;
  capturedAt: ISO8601;
};

export type PgvectorQueryResult = {
  query: string;
  hits: PgvectorQueryHit[];
  embeddingModel: string;
};

/**
 * Planned SQL schema for local derived recall (068).
 * Applied via infra/pgvector/migrations/001_init.sql when Postgres is up.
 */
export const PGVECTOR_SCHEMA_COMMENT = 'otto_embedding_chunks — provenance-first; never canon columns';

const DEFAULT_URL = 'postgresql://otto:otto@127.0.0.1:5433/otto_recall';
const DEFAULT_MODEL = 'otto-local-hash-v1';
const DEFAULT_DIMENSIONS = 8;
const MIGRATION_REL = 'infra/pgvector/migrations/001_init.sql';

export function pgvectorEnabled(): boolean {
  const flag = process.env.OTTO_PGVECTOR?.trim();
  return flag === '1' || flag === 'true';
}

export function resolvePgvectorUrl(): string {
  return (process.env.OTTO_PGVECTOR_URL ?? DEFAULT_URL).trim() || DEFAULT_URL;
}

export function resolveEmbeddingModel(): string {
  return (process.env.OTTO_PGVECTOR_EMBEDDING_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

export function resolveEmbeddingDimensions(): number {
  const raw = process.env.OTTO_PGVECTOR_EMBEDDING_DIMENSIONS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_DIMENSIONS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DIMENSIONS;
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Deterministic local embed — no API keys; cosine-ready unit-ish vectors. */
export function embedTextLocal(text: string, dimensions = resolveEmbeddingDimensions()): number[] {
  const vec = Array.from({ length: dimensions }, () => 0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return vec.map(() => 0);
  for (const token of tokens) {
    const digest = createHash('sha256').update(token, 'utf8').digest();
    for (let i = 0; i < dimensions; i += 1) {
      const byte = digest[i % digest.length] ?? 0;
      vec[i] += (byte / 255) - 0.5;
    }
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function chunkText(text: string, maxChars = 1200): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = '';
  for (const part of parts) {
    if (!buf) {
      buf = part;
    } else if (`${buf}\n\n${part}`.length <= maxChars) {
      buf = `${buf}\n\n${part}`;
    } else {
      chunks.push(buf);
      buf = part;
    }
    if (buf.length >= maxChars) {
      chunks.push(buf.slice(0, maxChars));
      buf = buf.slice(maxChars).trim();
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [trimmed.slice(0, maxChars)];
}

function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => Number(v.toFixed(8))).join(',')}]`;
}

function resolveRepoRoot(): string {
  return process.env.OTTO_ROOT ? resolve(process.env.OTTO_ROOT) : resolve(process.cwd());
}

function resolveMigrationSql(): string {
  return readFileSync(resolve(resolveRepoRoot(), MIGRATION_REL), 'utf8');
}

function resolveSourcePath(root: string, sourcePath: string): string {
  const trimmed = sourcePath.trim();
  if (!trimmed || isAbsolute(trimmed) || trimmed.split(/[\\/]+/).includes('..')) {
    throw new Error('sourcePath must stay within root and be relative');
  }
  const absRoot = resolve(root);
  const absPath = resolve(absRoot, trimmed);
  const rel = relative(absRoot, absPath);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('sourcePath must stay within root and be relative');
  }
  return absPath;
}

function resolveReadableSourcePath(root: string, sourcePath: string): string {
  const absRoot = resolve(root);
  const absPath = resolveSourcePath(absRoot, sourcePath);
  const realRoot = realpathSync(absRoot);
  const realPath = realpathSync(absPath);
  const rel = relative(realRoot, realPath);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('sourcePath must stay within root and be relative');
  }
  return realPath;
}

/** Optional local pgvector recall (068) — disabled unless OTTO_PGVECTOR=1. */
export class PgvectorStore {
  private lastStatus: PgvectorStatus = this.buildDisabledStatus();
  private lastIndexedAt: ISO8601 | null = null;
  private client: pg.Client | null = null;

  async status(): Promise<PgvectorStatus> {
    if (!pgvectorEnabled()) {
      this.lastStatus = this.buildDisabledStatus();
      return this.lastStatus;
    }
    return this.healthCheck();
  }

  async healthCheck(): Promise<PgvectorStatus> {
    const checkedAt = new Date().toISOString();
    const url = resolvePgvectorUrl();
    if (!pgvectorEnabled()) {
      this.lastStatus = this.buildDisabledStatus(checkedAt);
      return this.lastStatus;
    }

    this.lastStatus = {
      enabled: true,
      available: false,
      state: 'starting',
      connectionHint: url,
      lastCheckedAt: checkedAt,
      lastIndexedAt: this.lastIndexedAt,
      note: 'Checking local Postgres + pgvector extension…',
      error: null,
    };

    try {
      const client = await this.connect(url);
      await client.query('SELECT 1');
      const ext = await client.query<{ extname: string }>(
        "SELECT extname FROM pg_extension WHERE extname = 'vector'",
      );
      if (ext.rowCount === 0) {
        await client.query(resolveMigrationSql());
        const again = await client.query(
          "SELECT extname FROM pg_extension WHERE extname = 'vector'",
        );
        if (again.rowCount === 0) {
          throw new Error('pgvector extension missing after migration');
        }
      }
      this.lastStatus = {
        enabled: true,
        available: true,
        state: 'ready',
        connectionHint: url,
        lastCheckedAt: checkedAt,
        lastIndexedAt: this.lastIndexedAt,
        note: 'Local pgvector recall ready. Index sources via PgvectorStore.indexSource().',
        error: null,
      };
      return this.lastStatus;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const state: PgvectorLifecycle = message.match(/ECONNREFUSED|connect|timeout/i) ? 'stopped' : 'error';
      this.lastStatus = {
        enabled: true,
        available: false,
        state,
        connectionHint: url,
        lastCheckedAt: checkedAt,
        lastIndexedAt: this.lastIndexedAt,
        note: state === 'stopped'
          ? 'Postgres not reachable — run: cd infra/pgvector && docker compose up -d'
          : `pgvector health failed: ${message}`,
        error: message,
      };
      await this.disconnect();
      return this.lastStatus;
    }
  }

  async indexSource(
    sourcePath: string,
    sourceKind: PgvectorSourceKind,
    opts?: { root?: string; text?: string },
  ): Promise<PgvectorIndexResult> {
    if (!pgvectorEnabled()) {
      throw new Error('pgvector disabled — set OTTO_PGVECTOR=1');
    }
    const root = opts?.root ?? resolveRepoRoot();
    resolveSourcePath(root, sourcePath);
    const readablePath = opts?.text === undefined ? resolveReadableSourcePath(root, sourcePath) : null;
    const health = await this.healthCheck();
    if (!health.available) {
      throw new Error(health.error ?? health.note);
    }
    const raw = opts?.text ?? readFileSync(readablePath!, 'utf8');
    const contentHash = sha256Text(raw);
    const model = resolveEmbeddingModel();
    const dims = resolveEmbeddingDimensions();
    if (dims !== DEFAULT_DIMENSIONS) {
      throw new Error(`OTTO_PGVECTOR_EMBEDDING_DIMENSIONS must be ${DEFAULT_DIMENSIONS} for v1 schema`);
    }
    const maxChunks = Number.parseInt(process.env.OTTO_PGVECTOR_MAX_CHUNKS_PER_SOURCE ?? '32', 10);
    const chunks = chunkText(raw).slice(0, Number.isFinite(maxChunks) ? maxChunks : 32);
    const client = await this.connect(resolvePgvectorUrl());

    let written = 0;
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i] ?? '';
      const embedding = embedTextLocal(chunk, dims);
      const id = randomUUID();
      await client.query(
        `INSERT INTO otto_embedding_chunks
          (id, source_kind, source_path, content_hash, chunk_index, chunk_text, embedding, embedding_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)
         ON CONFLICT (source_kind, source_path, content_hash, chunk_index, embedding_model)
         DO UPDATE SET chunk_text = EXCLUDED.chunk_text, embedding = EXCLUDED.embedding, captured_at = now()`,
        [id, sourceKind, sourcePath, contentHash, i, chunk.slice(0, 2000), vectorLiteral(embedding), model],
      );
      written += 1;
    }

    this.lastIndexedAt = new Date().toISOString();
    this.lastStatus = { ...this.lastStatus, lastIndexedAt: this.lastIndexedAt };
    return { sourcePath, sourceKind, chunksWritten: written, contentHash, embeddingModel: model };
  }

  async query(text: string, opts?: { limit?: number }): Promise<PgvectorQueryResult> {
    if (!pgvectorEnabled()) {
      throw new Error('pgvector disabled — set OTTO_PGVECTOR=1');
    }
    const health = await this.healthCheck();
    if (!health.available) {
      throw new Error(health.error ?? health.note);
    }
    const limit = Math.min(Math.max(opts?.limit ?? 5, 1), 20);
    const model = resolveEmbeddingModel();
    const dims = resolveEmbeddingDimensions();
    const queryVec = embedTextLocal(text, dims);
    const client = await this.connect(resolvePgvectorUrl());
    const result = await client.query<{
      id: string;
      source_kind: string;
      source_path: string;
      content_hash: string;
      chunk_index: number;
      chunk_text: string;
      embedding_model: string;
      captured_at: Date;
      score: number;
    }>(
      `SELECT id, source_kind, source_path, content_hash, chunk_index, chunk_text, embedding_model, captured_at,
              1 - (embedding <=> $1::vector) AS score
         FROM otto_embedding_chunks
        WHERE embedding_model = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3`,
      [vectorLiteral(queryVec), model, limit],
    );

    return {
      query: text,
      embeddingModel: model,
      hits: result.rows.map((row) => ({
        id: row.id,
        sourceKind: row.source_kind,
        sourcePath: row.source_path,
        contentHash: row.content_hash,
        chunkIndex: row.chunk_index,
        snippet: row.chunk_text.slice(0, 280),
        score: Number(row.score),
        embeddingModel: row.embedding_model,
        capturedAt: row.captured_at.toISOString(),
      })),
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end().catch(() => undefined);
      this.client = null;
    }
  }

  private async connect(url: string): Promise<pg.Client> {
    if (this.client) return this.client;
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 });
    await client.connect();
    this.client = client;
    return client;
  }

  private buildDisabledStatus(checkedAt?: ISO8601): PgvectorStatus {
    return {
      enabled: false,
      available: false,
      state: 'disabled',
      connectionHint: null,
      lastCheckedAt: checkedAt ?? new Date().toISOString(),
      lastIndexedAt: null,
      note: 'Set OTTO_PGVECTOR=1 to opt into local vector recall. See docs/pgvector.md.',
      error: null,
    };
  }
}
