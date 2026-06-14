# pgvector local recall (optional, opt-in)

Otto may use **Postgres + pgvector** as a **derived recall substrate** under Knowledge. It is **not** canonical truth and is **disabled by default**.

## Authority

```txt
Canonical truth     → repo files + governed Letta memory
Behavior change     → Curation only
Derived recall      → pgvector rows (embeddings + provenance pointers)
```

pgvector returns context for read-only recall. It must not mutate Standards, Practices, or canon files. See [`docs/v1/contracts/adapter-seam.md`](v1/contracts/adapter-seam.md).

## Status (v1)

| Layer | State |
|-------|--------|
| Docs + env contract | This file |
| Infra | `infra/pgvector/` Compose + migrate/health scripts |
| Desktop store | `PgvectorStore` — `indexSource`, `query`, `healthCheck` |
| Embeddings | Deterministic local hash embed (`otto-local-hash-v1`) — no API keys in Otto |
| Settings / Knowledge | Honest lifecycle: disabled · stopped · starting · ready · error |

Enable with `OTTO_PGVECTOR=1`. **ready** only after Postgres is up, migration applied, and health passes.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `OTTO_PGVECTOR` | unset | `1` / `true` opts into pgvector |
| `OTTO_PGVECTOR_URL` | `postgresql://otto:otto@127.0.0.1:5433/otto_recall` | Postgres URL when enabled |
| `OTTO_PGVECTOR_EMBEDDING_MODEL` | `otto-local-hash-v1` | Model id stored on rows |
| `OTTO_PGVECTOR_EMBEDDING_DIMENSIONS` | `8` | Must match migration `vector(8)` |
| `OTTO_PGVECTOR_MAX_CHUNKS_PER_SOURCE` | `32` | Safety cap per source file |
| `OTTO_PGVECTOR_INTEGRATION` | unset | `1` runs live DB tests |

Embedding API keys **never** belong in `~/.otto/config.json`.

## Schema

Migration: `infra/pgvector/migrations/001_init.sql`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE otto_embedding_chunks (
  id              UUID PRIMARY KEY,
  source_kind     TEXT NOT NULL,
  source_path     TEXT NOT NULL,
  content_hash    TEXT NOT NULL,
  chunk_index     INT NOT NULL,
  chunk_text      TEXT NOT NULL,
  embedding       vector(8) NOT NULL,
  embedding_model TEXT NOT NULL,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_kind, source_path, content_hash, chunk_index, embedding_model)
);
```

## Bring-up

```sh
cd infra/pgvector
docker compose up -d
./scripts/pgvector-migrate.sh
./scripts/pgvector-health.sh
```

Or point `OTTO_PGVECTOR_URL` at an existing Postgres instance with the `vector` extension.

## Store API

`apps/desktop/electron/pgvector-store.ts`:

- `status()` / `healthCheck()` — lifecycle + connectivity
- `indexSource(path, kind)` — chunk, embed, upsert (idempotent on content hash)
- `query(text, { limit })` — cosine-ranked hits with `source_path`, `content_hash`, snippet

IPC: `otto:pgvector:status` (async health when enabled).

## Relationship to Cognee

Cognee (040–044) is a separate graph/recall path. pgvector backs thin semantic search without Cognee. Prefer **one Postgres instance** on port 5433 if both need SQL — see `infra/pgvector/README.md`.

## Verification

```sh
bun install
bun test apps/desktop/electron/pgvector-store.test.ts

# optional live proof (requires docker compose up)
OTTO_PGVECTOR_INTEGRATION=1 OTTO_PGVECTOR=1 bun test apps/desktop/electron/pgvector-store.test.ts
./infra/pgvector/scripts/pgvector-health.sh
```

Staging receipt: `docs/receipts/staging/068-pgvector-local-recall-store.md`
