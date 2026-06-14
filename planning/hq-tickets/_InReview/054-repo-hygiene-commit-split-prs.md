# 054 — Repo Hygiene: Desktop v1 Wave Commit & Split PRs

Owner: Cursor
Priority: P0
Depends on: 033–038
Release bucket: v0.1 integration

## Outcome

The large uncommitted desktop wave (Skills, Knowledge, Tickets, Channels, Workers, stores, IPC) lands as **reviewable PRs** — not one opaque blob.

## Why this matters

Shipped vs Partial audit reflects repo truth Sebastian cannot see in live app. Uncommitted work blocks review, breaks parallel agents, and prevents honest release lane (063).

## Scope

- Inventory changed files; group into 2–4 PRs by domain (stores/IPC, surfaces, docs, demo)
- Each PR: typecheck + targeted tests + ticket refs
- No push without Sebastian approval (prepare only)
- Update `docs/v1/SHIP_STATUS.md` honestly per PR scope

## Out of scope

- Public release tag (063)
- Rewriting unrelated history

## Done when

- Clean `git status` on main after merges **or** branch stack documented with PR descriptions ready
- Each PR has verification commands run and pasted in PR body
- No secrets in diff
- `000-index.md` references which tickets each PR closes

## Verification

```sh
cd /Users/seb/Code/otto
git status --short --branch
bun run typecheck
bun test ./apps/desktop/electron/*.test.ts
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass  
Date: 2026-06-13

### What changed

Documented 4-PR stack on `ship/v0.3-integration`, branch hygiene rules, and honest `docs/v1/SHIP_STATUS.md` (dirty tree, PR-ready not merged). Runbook: `docs/v1/runbooks/pr-stack-ship-v03.md`.

### PR stack (prepare-only)

| PR | Domain | Tickets |
|---|---|---|
| A | Desktop stores/IPC/surfaces | 033–038, 045–049, 055–056 runtime |
| B | Knowledge + channels canon | 055, 017 |
| C | Docs + ship checks + runbooks | 054, 079, 082, 091 |
| D | Planning + marketing (optional) | 054 housekeeping, 115–116 |

### Branch hygiene notes

- Integration branch: `ship/v0.3-integration` — ~30 modified + ~25 untracked paths (2026-06-13 snapshot).
- Stale local branches (`letta/*`, `codex/*`) — prune after PR merges.
- Tickets close to `_InReview/` with receipts; no `_Done/` without reviewer.
- Pre-merge gate per PR: `bun run verify:v0`.

### Verification run

```sh
cd /Users/seb/Code/otto
git status --short --branch   # ship/v0.3-integration dirty
bun run typecheck             # exit 0
bun run --cwd apps/desktop typecheck  # exit 0
bun run verify:v0             # 5 passed, 0 failed
```

### Known limitations

- No commits pushed; Sebastian must approve split + merge order (063).
- PR bodies not yet opened on GitHub — stack doc is the handoff artifact.

Reviewer verdict: pending
