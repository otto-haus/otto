# 152 - AI Frontier Review Daily Note Idempotency

Owner: Codex
Priority: P1
Depends on: none
Related: 062
Release bucket: vNext knowledge

## Outcome

Repeated manual AI frontier review runs on the same day update receipts/facts without appending duplicate placeholder notes to `knowledge/ai-frontier/capability-notes.md`.

## Why this matters

Knowledge files are canon. A routine receipt should prove repeated runs, but canon notes should not grow identical operational placeholders every time a manual review is clicked or retried.

## Scope

- Review the manual AI frontier review executor from ticket 062.
- Keep the v1 manual paste-slot design.
- Make the daily capability note write idempotent.
- Add a focused double-run regression test.

## Out of scope

- Cleaning existing local duplicate note artifacts already present in the dirty worktree.
- Changing registry update semantics.
- Changing Curation proposal routing.
- Opening a remote PR without Sebastian approval.

## Critique pass - 2026-06-14 Codex

Feature reviewed: manual AI frontier review routine.

Design decisions:

- Right: the routine updates `last_reviewed` and per-model `last_verified` facts, then writes a receipt.
- Right: routing-policy changes are routed into Curation proposals instead of silently mutating routing.
- Right: the capability-notes paste slot keeps v1 honest when no live benchmark ingestion exists.
- Wrong: the capability-notes update used unconditional append semantics, so repeated same-day runs produced duplicate identical placeholders in a canonical knowledge file.

Docs/best-practice context:

- Context7 Node.js docs confirm `fs.appendFileSync` synchronously appends data and creates the file if needed.
- Context7 Node.js docs confirm `fs.readFileSync` returns file contents and `fs.writeFileSync` replaces an existing file. That supports a read-before-write guard for idempotent canon updates.

## Rebuild

- Replaced unconditional `appendFileSync` with a marker check using `readFileSync`.
- Only writes the daily review note when `<!-- ai-frontier-review YYYY-MM-DD -->` is not already present.
- Preserved existing capability-note content endings instead of trimming canon text during append.
- Preserved registry and receipt writes on repeated runs.
- Added a double-run regression test that asserts one daily marker.

## Done when

- [x] Same-day manual runs do not duplicate the capability-notes placeholder.
- [x] Registry update and receipt behavior remain intact.
- [x] Routing-change proposal behavior remains intact.
- [x] Focused executor test passes.
- [x] Electron typecheck passes.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Verification

```sh
bun test ./apps/desktop/electron/ai-frontier-review-executor.test.ts
bun run --cwd apps/desktop electron:typecheck
```

Result: both passed on 2026-06-14.

## Blocker log

- Independent reviewer +1 pending.
- PR not opened: remote publication is approval-gated, and the worktree contains unrelated dirty files outside this ticket.
