# 051 — Automated Review Gate (No Fake Done)

Owner: Codex
Priority: P1
Depends on: 004, 035, 050
Release bucket: v0.1 governance

## Outcome

Workers and implementers **cannot self-certify Done**. Ticket/charter completion requires reviewer lane + evidence mapped to acceptance criteria.

Implements AGENTS.md topology: one Claude lane + one Codex lane; unbiased reviewer subagent; AC-by-AC +1.

## Why this matters

Standards "No Fake Done" is poster until it blocks premature completion. Charter AC gate (034) is one slice; this is the product-wide gate.

## Scope

- Ticket lifecycle states: `implementing → in_review → done` with hard transition rules
- Completion API refuses `done` without `reviewer_verdict: +1` and evidence refs
- Charter complete integrates 034 AC checks
- Desktop Tickets/Charters UI shows blocked reason
- Template for reviewer packet export

## Out of scope

- Auto-launching external subagents (manual launch documented)
- GitHub PR integration

## Done when

- Attempt complete without reviewer → blocked with explicit reason
- With fixture +1 and evidence → completes
- 034 charter fake-complete still blocked
- Unit tests for transition guards
- Doc update in `AGENTS.md` or ticket workflow pointing to gate

## Verification

```sh
bun test ./apps/desktop/electron/ticket-store.test.ts
bun test ./apps/desktop/electron/charter-store.test.ts
```

## Blocker log

Leave blank unless blocked.
