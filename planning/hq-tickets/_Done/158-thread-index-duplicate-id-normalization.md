# 158 - Thread Index Duplicate ID Normalization

Owner: Codex
Priority: P1
Related: 046
Release bucket: v0.1 chat

## Outcome

The local chat thread index treats duplicate thread IDs as corrupted state and normalizes them before public store operations can mutate or re-persist the index.

## Why this matters

Ticket 046 made multi-thread chat state user-visible. If `threads/index.json` contains duplicate IDs, list-time filtering can hide the duplicate in the sidebar while `get`, `update`, `pin`, and `touchActive` still operate on the first raw row. That can resurrect stale titles, preserve duplicate rows, and make pin/archive state look non-deterministic.

## Scope

- Normalize thread records by ID at the Electron store boundary.
- Preserve the current sorted canonical row: pinned first, then latest `updatedAt`.
- Ensure every index write persists one row per thread ID.
- Add a focused regression for a manually duplicated `index.json`.

## Out of scope

- Changing thread ID format.
- Changing renderer pinning UI.
- Migrating historical local thread directories or message localStorage keys.
- Live Letta conversation smoke.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: local chat thread index persistence.

Design decisions:

- Right: the thread index is a local file-backed source for desktop chat list state, which fits v1 local-only otto.
- Right: sorting pinned threads first and recent threads next makes the active list predictable.
- Wrong: deduping only in `list()` made the sidebar look clean while leaving duplicate IDs in the file and in mutation paths.
- Wrong: `update()` used the first raw duplicate row, so a stale duplicate could win during a later pin/archive/touch mutation.
- Right fix: normalize on read and write so every public store path sees the same canonical row and future writes repair the index.

Docs/best-practice context:

- Context7 Node.js fs docs confirm file writes replace/create the target file under the default write behavior, so the right repair point is the JSON array we serialize, not an append/patch layer.
- Exa was not available through tool discovery in this session.

## Rebuild

- Added `normalizeThreads()` to sort records and keep the first canonical row for each thread ID.
- Applied normalization in `readIndex()` and `writeIndex()`.
- Simplified `list()` back to operating on already-normalized store data.
- Added a regression that seeds a duplicated `index.json`, verifies the canonical row is shown, pins it, and verifies the persisted index contains one pinned row.

## Done when

- [x] Duplicate thread IDs in `index.json` collapse to one canonical row.
- [x] Mutating a duplicated thread updates the canonical row, not a stale duplicate.
- [x] The next persisted index write contains one row for the duplicated ID.
- [x] Focused thread-store tests pass.
- [x] Core/practices typecheck passes.
- [x] Desktop renderer and Electron typechecks pass.
- [x] Staging desktop refresh succeeds without touching live `/Applications/otto.app`.
- [x] Independent reviewer +1.
- [x] PR opened after approval and clean branch review.

## Execution receipt

Repo path: `/Users/seb/Code/otto`

Branch: `ship/functional-labs`

Git status summary:

- Dirty worktree with multiple unrelated in-progress files.
- Ticket-scoped files: `apps/desktop/electron/thread-store.ts`, `apps/desktop/electron/thread-store.test.ts`.
- Ticket receipt file: `planning/hq-tickets/_InReview/158-thread-index-duplicate-id-normalization.md`.
- `task staging` regenerated the already-dirty `apps/desktop/src/data/readiness.json` as part of the mandatory staging build; that generated file is not part of this ticket's scoped code change.

Files changed:

- `apps/desktop/electron/thread-store.ts`
- `apps/desktop/electron/thread-store.test.ts`
- `planning/hq-tickets/_InReview/158-thread-index-duplicate-id-normalization.md`

Commands run:

```sh
bun test ./apps/desktop/electron/thread-store.test.ts
bun run --cwd apps/desktop electron:typecheck
bun run typecheck
bun run --cwd apps/desktop typecheck
git diff --check -- apps/desktop/electron/thread-store.ts apps/desktop/electron/thread-store.test.ts
task staging
```

Result: focused tests, typechecks, scoped diff-check, and staging build/package/open passed on 2026-06-14.

Staging paths:

- Staging app: `/Applications/otto-staging.app`
- Isolated home: `/Users/seb/.codex/admin/otto-staging/home`
- Isolated otto home: `/Users/seb/.codex/admin/otto-staging/otto-home`
- Profile: `/Users/seb/.codex/admin/otto-staging/profile`
- Debug port: `9445`

Proof mapped to Done when:

- Duplicate collapse: `normalizes duplicate thread ids before mutating the index` seeds two rows with `id=local_duplicate` and sees only `Canonical duplicate` in `store.list(true)`.
- Canonical mutation: the same test calls `store.pin('local_duplicate', true)` and expects the returned title to remain `Canonical duplicate`.
- Persisted repair: the same test reads `threads/index.json` and expects exactly one pinned row for `local_duplicate`.

Known gaps:

- No live Letta conversation smoke; this is pure local thread-index persistence.
- PR not opened because remote publication is approval-gated and the worktree contains unrelated dirty files.

- PR: https://github.com/otto-haus/otto/pull/35

## Review

Reviewer: GoalBuddy Judge subagent (`019ec6b5-978e-7ea1-9c6f-46c287fc4548`)
Date: 2026-06-14
Verdict: +1

### Checked against Done when

- Duplicate thread IDs in `index.json` collapse to one canonical row: Pass.
- Mutating a duplicated thread updates the canonical row, not a stale duplicate: Pass.
- The next persisted index write contains one row for the duplicated ID: Pass.
- Focused thread-store tests pass: Pass.
- Core/practices typecheck passes: Pass.
- Desktop renderer and Electron typechecks pass: Pass.
- Staging desktop refresh succeeds without touching live `/Applications/otto.app`: Pass.

### Evidence

- `readIndex()` filters valid IDs and normalizes through `normalizeThreads(sortThreads(...))`.
- `update`, `pin`, `archive`, and `touchActive` read normalized data before mutation.
- `writeIndex()` serializes normalized rows, so mutation writes repair duplicate IDs.
- `normalizes duplicate thread ids before mutating the index` covers duplicate collapse, canonical mutation, and persisted one-row repair.

### Remaining gate

PR/open-state Done when remains approval-gated and not complete.
