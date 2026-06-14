# 036 — Curation: deferred proposals in decided filter

Owner: Claude
Priority: P1
Depends on: none
Release bucket: v0.1

## Outcome

Deferred proposals appear under a “decided” (or dedicated deferred) filter, not stuck in Pending.

## Why this matters

Inbox filters mislead operators about queue state; deferred items look still pending.

## Scope

- `Panes.tsx` Curation: adjust `PENDING_STATUSES` / filter logic for `deferred`
- Honest copy on filter labels

## Out of scope

- Approvals panel showing pre-decision pending items (by design — ratification records only)

## Done when

- Defer a proposal → visible under decided/deferred filter, not pending
- Manual smoke on staging Curation surface

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
```

## Execution receipt (2026-06-14)

- **036** deferred filter: `deferred` removed from pending set in `Panes.tsx`

## Blocker log

Leave blank unless blocked.
