# PR stack — ship/v0.3-integration

Updated: 2026-06-13  
Branch: `ship/v0.3-integration` (tracks `origin/ship/v0.3-integration`)  
Gate: **no push without Sebastian approval** (063)

## Branch hygiene

- Integration branch carries the desktop v1 wave + culture tickets; do not commit unrelated work here.
- Completed HQ tickets move to `planning/hq-tickets/_InReview/` with execution receipts — never `_Done/` without reviewer +1.
- Stale `letta/*` and `codex/*` worktrees remain local; delete after their PRs merge.
- Pre-merge on each PR: `bun run typecheck`, `bun run --cwd apps/desktop typecheck`, targeted `bun test ./apps/desktop/electron/*.test.ts`, `bun run verify:v0`.

## Proposed PR stack (4 PRs)

Review order: **A → B → C → D** (each rebased on prior merge).

### PR-A — Desktop stores, IPC, surfaces

**Tickets:** 033–038, 045–049, 055, 056 (runtime), 123–124 (partial)

**Paths (indicative):**

- `apps/desktop/electron/*-store.ts`, `ticket-orchestrator.ts`, `ipc.ts`, `preload.ts`
- `apps/desktop/electron/*.test.ts` (store + orchestrator + chat-ticket)
- `apps/desktop/src/surfaces/Panes.tsx`, `Chat.tsx`, `runtime.ts`, `copy/surfaces.ts`
- `packages/core/src/types.ts` (surface types)

**Verification:**

```sh
bun run --cwd apps/desktop typecheck
bun test ./apps/desktop/electron/knowledge-store.test.ts \
  ./apps/desktop/electron/skill-store.test.ts \
  ./apps/desktop/electron/ticket-store.test.ts \
  ./apps/desktop/electron/channel-store.test.ts \
  ./apps/desktop/electron/ticket-orchestrator.test.ts
```

### PR-B — Knowledge + channels file canon

**Tickets:** 055, 017, 040 (docs only)

**Paths:**

- `knowledge/**`, `channels/**`, `docs/knowledge.md`, `docs/cognee.md`
- `receipts/otto-v01/knowledge.md`, `channels.md`
- `docs/v1/SHIP_CHECKS/knowledge.md`, `channels.md`

**Verification:**

```sh
bun test ./apps/desktop/electron/knowledge-store.test.ts
bun test ./apps/desktop/electron/channel-store.test.ts
```

### PR-C — Docs, ship checks, runbooks

**Tickets:** 054, 079, 082, 091, 067, ADRs

**Paths:**

- `docs/v1/SHIP_STATUS.md`, `docs/v1/SHIP_CHECKS/**`, `docs/v1/runbooks/**`
- `docs/v1/contracts/**`, `docs/v3/README.md`, `docs/runtime-transport.md`
- `SHIP_CHECKS/**` (root mirror — canonical `docs/v1/SHIP_CHECKS/**`; sync on change)
- `README.md`, `RELEASE_CHECKLIST.md`

**Verification:**

```sh
bun run verify:v0
```

### PR-D — Planning conveyor + marketing (optional split)

**Tickets:** 054 housekeeping, 115–116, 065, 067, parked moves

**Paths:**

- `planning/hq-tickets/**` (_InReview moves, new tickets, index)
- `site/**`, `docs/marketing/**`, `docs/onepagers/**`

**Verification:** doc link sanity only; no runtime gate.

## Current dirty-tree snapshot

Run before each PR split:

```sh
cd /Users/seb/Code/otto
git status --short --branch
```

As of 2026-06-13: ~30 modified + ~25 untracked paths on `ship/v0.3-integration`. Split using paths above; do not mix marketing into PR-A.

## Index cross-ref

`planning/hq-tickets/000-index.md` rows 054–056 close when PR stack is documented, ship checks have evidence, and staging smoke receipts exist under `receipts/otto-v01/`.
