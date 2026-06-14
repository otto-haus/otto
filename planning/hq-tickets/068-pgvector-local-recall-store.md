# 068 — pgvector: Local Recall Store (Optional)

Owner: Codex
Priority: P2
Depends on: 040, 055
Release bucket: vNext knowledge

## Outcome

Otto can run an **optional local Postgres + pgvector** stack as a **derived recall substrate** under Knowledge — so Sebastian can add vector search without cloud signup, without replacing file canon, and without faking a “connected” state.

When done:

```txt
Docs      → pgvector contract (what it may index/recall; what it must never mutate)
Infra     → local bring-up path (Docker Compose or existing Postgres + extension)
Store     → typed embed/query API with provenance on every row
Settings  → pgvector: disabled | stopped | starting | ready | error
Knowledge → optional “Semantic recall” section (honest empty when off)
Receipt   → boot/health + one query proof artifact
```

pgvector is **storage + similarity search**, not a graph engine and not canonical truth.

## Why this matters

Otto’s Knowledge layer will eventually need **semantic recall** over canon (charters, receipts, standards snippets, HQ tickets, observed-performance notes). Files + grep do not scale; Cognee (040–044) is one path. **pgvector gives a simpler, owned substrate**: embeddings in Postgres with full provenance, local-first, inspectable SQL.

This ticket makes “add pgvector” a **first-class optional capability** — whether Cognee uses it as a backend later or Otto queries it directly for thin recall.

## Authority stack (unchanged)

```txt
Canonical truth     → repo files + Letta memory (governed separately)
Behavior change     → Curation only
Derived recall      → pgvector rows (embeddings + metadata + source pointers)
```

Align with `docs/v1/contracts/adapter-seam.md`:

- pgvector returns `context` and may emit `proposals` — never applies canon
- Every indexed document carries: `source_kind`, `source_path`, `content_hash`, `captured_at`, `embedding_model`

## Relationship to Cognee (040–044)

```txt
Option A (recommended v1): Otto-native VectorRecallStore on pgvector — thin semantic search without Cognee
Option B (later): Cognee configured to use the same Postgres/pgvector instance as its backend
```

Do **not** require Cognee to ship pgvector. Do **not** duplicate Cognee graph features in SQL. If both run, document one Postgres instance vs two in `docs/pgvector.md`.

## Architecture target

### 1. Local infra

Add `infra/pgvector/` (or `knowledge/pgvector/`) with:

```txt
docker-compose.yml     postgres:16+ with pgvector extension (official image or init script)
.env.example           OTTO_PGVECTOR_* vars (no secrets in repo)
scripts/
  pgvector-up.sh       start + wait for healthy
  pgvector-down.sh     stop
  pgvector-health.sh   exit 0 when SELECT 1 + extension present
```

Support **bring-your-own Postgres**: if `OTTO_PGVECTOR_DATABASE_URL` points at an existing instance, skip Compose.

Env contract (document all):

```txt
OTTO_PGVECTOR_ENABLED=0|1              default 0
OTTO_PGVECTOR_DATABASE_URL             e.g. postgresql://otto:otto@127.0.0.1:5433/otto_recall
OTTO_PGVECTOR_EMBEDDING_MODEL          e.g. local model id or provider ref (keys stay in Letta/env, not Otto canon)
OTTO_PGVECTOR_EMBEDDING_DIMENSIONS     must match model + schema
OTTO_PGVECTOR_MAX_CHUNKS_PER_SOURCE     safety cap
```

Embedding provider: **do not** hardcode API keys in Otto repo. Use Letta/runtime or explicit env at embed time; receipt records model id only.

### 2. Schema (minimal)

Migration SQL (idempotent):

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- provenance-first; no canon columns
CREATE TABLE otto_embedding_chunks (
  id            UUID PRIMARY KEY,
  source_kind   TEXT NOT NULL,   -- standard | receipt | charter | ticket | knowledge | practice | ...
  source_path   TEXT NOT NULL,   -- repo-relative or absolute file path
  content_hash  TEXT NOT NULL,   -- sha256 of chunked text
  chunk_index   INT NOT NULL,
  chunk_text    TEXT NOT NULL,   -- optional: store text for debug; may truncate
  embedding     vector(N) NOT NULL,
  embedding_model TEXT NOT NULL,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_path, content_hash, chunk_index, embedding_model)
);

CREATE INDEX ON otto_embedding_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);  -- tune at scale; document rebuild requirement
```

Add companion table or JSON column for **query audit** (optional v1): `otto_recall_queries` with query hash, top-k ids, receipt link.

### 3. Otto store module

`apps/desktop/electron/pgvector-store.ts` (or `packages/core/src/pgvector/`) with:

```txt
getStatus()           → disabled | stopped | starting | ready | error + message
healthCheck()         → extension + connectivity
indexSource(path, kind) → chunk, embed, upsert (idempotent on content_hash)
indexBatch(paths[])   → receipt-friendly batch import
query(text, opts)     → ranked hits with source_path, score, snippet, provenance
deleteStale()         → rows whose source_path no longer exists (optional v1)
```

IPC + preload + Settings row mirroring Cognee/Letta readiness patterns in `Panes.tsx`.

### 4. Indexing scope (v1)

**In scope for first index pass:**

- `standards/**/*.md`
- `receipts/**/*.json` (summary fields only)
- `planning/hq-tickets/**/*.md` (exclude `_Done` optional — document choice)
- `knowledge/ai-frontier/**/*.md`
- `charters/` if present

**Out of scope v1:**

- Letta memory blocks (separate governance)
- Full repo binary crawl
- Automatic re-index on every file save (manual or Routine-triggered first)

Indexing command:

```sh
bun run pgvector:index --paths standards,receipts,knowledge
```

### 5. Knowledge UI (thin)

Extend Knowledge pane (after 055):

```txt
Semantic recall (pgvector)
  Status: ready | disabled | error
  Last index: <timestamp> + receipt link
  [Re-index selected paths]   → writes receipt; no silent background unless Routine
  Sample query box (dev/staging) → shows hits + source links; no auto-apply
```

No giant dashboard. No mock results when disabled.

### 6. Curation bridge

High-confidence recall must not change behavior silently. Optional hook:

- `query` results feed **Chat context** (read-only injection) when enabled
- Insights that imply policy change → `CurationProposal` with `source: manual` or new `vector_recall` source kind (add to `packages/core/src/types.ts` if needed)

## Scope

- Local Postgres + pgvector bring-up documented and scripted
- Schema migration + store module + tests
- Settings status + IPC
- Thin Knowledge UI section
- One indexing + one query receipt on staging

## Out of scope

- Cloud-managed Postgres (document BYO URL only)
- Replacing Cognee graph (044) — complementary
- Paperclip, Discord, marketing site
- Automatic embedding model training/fine-tuning
- pgvector as source of truth for Standards/Practices
- Bundling Postgres inside Electron `.app` (Compose/local service only v1)

## Done when

- [ ] `docs/pgvector.md` defines authority boundaries and env contract
- [ ] `infra/pgvector/` starts Postgres+pgvector locally; health script passes
- [ ] Migration applies; extension verified via `SELECT extname FROM pg_extension WHERE extname = 'vector'`
- [ ] `pgvector-store` indexes one fixture path idempotently (re-run does not duplicate rows)
- [ ] `query()` returns ranked hits with `source_path` + `content_hash` provenance
- [ ] Settings shows honest status (disabled by default; ready only after health + optional index)
- [ ] Knowledge pane section renders status + last index receipt (or empty state)
- [ ] Staging receipt: index batch + query + screenshot path recorded in ticket
- [ ] `bun test` includes store unit tests (mock DB or testcontainer if feasible; else integration script)
- [ ] Reviewer +1

## Verification

```sh
cd /Users/seb/Code/otto
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test apps/desktop/electron/pgvector-store.test.ts   # after added

# infra (when implemented)
./infra/pgvector/scripts/pgvector-health.sh
OTTO_PGVECTOR_ENABLED=1 bun run pgvector:index --paths knowledge/ai-frontier
OTTO_PGVECTOR_ENABLED=1 bun run pgvector:query -- "model routing assumptions"

bash apps/desktop/scripts/deploy-staging.sh
# staging: Settings → pgvector row; Knowledge → semantic recall empty/ready
```

## Sequencing note

- Safe to start **after 040** (contract culture) and **055** (Knowledge baseline shipped)
- Can run **parallel to 041–044** if staffed; coordinate Postgres ports with Cognee home (041) — one instance preferred
- Unblocks richer Intake (019) and People packs (024) later; not required for v0.1 release lane (063)

## Blocker log

Leave blank unless blocked.
