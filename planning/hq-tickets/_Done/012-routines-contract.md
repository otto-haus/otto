# 012 — Routines Contract

Owner: Codex
Priority: P2
Depends on: 010

## Outcome

Otto can represent recurring work without silently activating it.

## Scope

- Routine model.
- Manual run first.
- Approval gate for recurring activation.
- Receipt link.

## Done when

- Routine can be represented.
- Routine can be manually run.
- Manual run writes receipt.
- Recurring/autonomous activation requires approval.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `012` depends on `010`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../012-routines-contract.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `010` is not accepted.

### Required changes

- Complete and accept `010` into `_Done`.
- Implement ticket `012`.
- Append an execution receipt proving routine representation, manual run, receipt write, and approval-gated recurring/autonomous activation.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 22:30 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- Added `RoutineStore` loading `routines/<slug>/routine.yaml` (`storage: 'files'`).
- Added `RoutineReference` + optional `routine` on `otto.receipt.v1`.
- IPC: `otto:routines:list`, `get`, `activation-gate`, `run-manual`; preload `window.otto.routines.*`.
- Manual run writes receipt with `action: routine.run.manual` and routine reference.
- `activationGate()` blocks recurring activation when `schedule` + `requires_approval_to_activate`.

## Verification

- `bun test ./electron/routine-store.test.ts` -> pass (11 total with practice/standard tests)
- `bun run typecheck` -> pass
- Smoke JSON: `/Users/seb/.codex/admin/otto-012-routines-contract-smoke-20260613T223000.json`

## Done when mapping

| Done when | Proof |
|---|---|
| Routine can be represented | `RoutineStore.listResult()` loads morning + peers from `routines/` |
| Routine can be manually run | `runManual('morning')` succeeds |
| Manual run writes receipt | Receipt includes `routine` ref + `subject.type: routine` |
| Recurring activation requires approval | `activationGate('morning').allowed === false` |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 7)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 012 proven. Move to `_Done`.
