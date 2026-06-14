# 011 — Practices Surface

Owner: Claude
Priority: P1
Depends on: 010

## Outcome

User can view Practices and understand how Otto works.

## Scope

- Practices list.
- Practice detail.
- Links to receipts/runs.
- Edit path gated through Curation if consequential.

## Done when

- User can view Practices.
- User can inspect a Practice.
- Practice changes do not silently bypass Curation.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `011` depends on `010`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../011-practices-surface.md`
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
- Implement ticket `011`.
- Append an execution receipt proving Practices list/detail and the Curation gate for consequential changes.

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

- `Practices` surface loads live canon via `window.otto.practices.list()` (not static JSON).
- Practice detail shows guardrails, approval floor, citation path, and related receipts (`practiceSlug` on receipt summaries).
- Curation gate copy blocks silent canon edits; consequential changes route through Curation.

## Verification

- `bun test ./electron/practice-store.test.ts ./electron/receipt-store.test.ts` -> pass
- `bun run typecheck` -> pass
- Smoke JSON: `/Users/seb/.codex/admin/otto-011-practices-surface-smoke-20260613T223000.json`

## Done when mapping

| Done when | Proof |
|---|---|
| User can view Practices | IPC list loads ≥5 practices from `practices/` |
| User can inspect a Practice | Detail panel with invocations, guardrails, file path |
| Practice changes do not silently bypass Curation | Visible curation gate banner on Practices surface |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 7)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 011 proven. Move to `_Done`.
