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
