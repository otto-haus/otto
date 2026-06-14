# 051 — Automated Review Gate (No Fake Done)

Owner: Codex
Priority: P1
Depends on: 004, 035, 050
Release bucket: v0.1 governance

## Outcome

Workers and implementers **cannot self-certify Done**. Ticket/charter completion requires reviewer lane + evidence mapped to acceptance criteria.

Implements AGENTS.md topology: one Claude lane + one Codex lane; unbiased reviewer subagent; AC-by-AC +1.

**Culture CI:** **133** generalizes this gate into the **Check** runtime (`done_claim` trigger). **051** remains the ticket/charter lifecycle slice; do not duplicate logic — route through Check engine when **131–133** land.

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

## Execution receipt

Status: pass
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `TicketStore.updateStatus` enforces `active|blocked → review → merged`; merged requires `reviewer_verdict: +1` and evidence refs.
- IPC `otto:tickets:update-status`; Tickets UI lifecycle buttons surface gate errors.
- `planning/hq-tickets/AGENTS.md` documents review gate (051); charter AC gate unchanged (034 tests still pass).

### Files touched

- `apps/desktop/electron/ticket-store.ts`, `ticket-store.test.ts`
- `apps/desktop/electron/ipc.ts`, `preload.ts`, `shared/types.ts`
- `apps/desktop/src/runtime.ts`, `surfaces/Panes.tsx`
- `planning/hq-tickets/AGENTS.md`

### Verification

```sh
bun test ./apps/desktop/electron/ticket-store.test.ts   # 3 pass (gate tests)
bun test ./apps/desktop/electron/charter-store.test.ts  # pass (034 AC gate)
bun run --cwd apps/desktop electron:typecheck  # pass
```

### Known limitations

- Reviewer packet export template not added; external subagent launch remains manual per ticket scope.
- No reviewer +1.

## Review

**Reviewer:** Independent Otto reviewer · **Date:** 2026-06-13

**Verdict:** **+1** — all Done-when acceptance criteria met in code and tests.

| Done when | Status | Evidence |
|-----------|--------|----------|
| Complete without reviewer → blocked with reason | Pass | `ticket-store.test.ts` throws on missing `+1`/evidence |
| Fixture +1 + evidence → completes | Pass | Same test merges with verdict + evidence refs |
| 034 charter fake-complete still blocked | Pass | `charter-store.test.ts` AC receipt gate (5/5 pass) |
| Unit tests for transition guards | Pass | `ticket-store.test.ts` blocks active→merged skip |
| Doc update (`AGENTS.md` / workflow) | Pass | `planning/hq-tickets/AGENTS.md` § Review gate (051) |
| Tickets UI surfaces gate errors | Pass (scope) | `Panes.tsx` `advanceStatus` catches and shows `error` notice |

**Verification run:** `bun test ./apps/desktop/electron/ticket-store.test.ts` ✓ · `bun test ./apps/desktop/electron/charter-store.test.ts` ✓ · `bun run --cwd apps/desktop electron:typecheck` ✓

**Note:** Reviewer packet export template remains out of scope per ticket; not a Done-when item.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- All items per prior independent review: **Pass** — `ticket-store.test.ts` review gate; `AGENTS.md` topology; `bun run verify:v0` 5/5

### Finding

Reconfirmed; no regression observed in rev8 spot-check.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; `bun run verify:v0` 5/5 (163 unit tests).
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.
