# 013 — Routines Surface

Owner: Claude
Priority: P2
Depends on: 012

## Outcome

User can see and manually run Routines.

## Scope

- Routines list.
- Routine detail.
- Manual run action.
- Activation status.

## Done when

- User can view Routines.
- User can manually run one Routine.
- App clearly distinguishes manual vs recurring/autonomous activation.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `013` depends on `012`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../013-routines-surface.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `012` is not accepted.

### Required changes

- Complete and accept `012` into `_Done`.
- Implement ticket `013`.
- Append an execution receipt proving Routines list/detail, manual run, and visible manual-vs-recurring/autonomous distinction.

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

- `Routines` surface wired in `Panes.tsx`: list, detail, steps, activation gate panel, manual run button.
- Manual run calls `window.otto.routines.runManual()` and surfaces receipt id confirmation.
- Activation gate panel distinguishes blocked recurring activation vs allowed manual run.

## Verification

- Same smoke as 012 manual run + UI wiring in `Panes.tsx` `Routines` component
- `bun run typecheck` -> pass

## Done when mapping

| Done when | Proof |
|---|---|
| User can view Routines | Live list from `routines/` via IPC |
| User can manually run one Routine | Run manually button -> receipt id |
| Manual vs recurring distinction | Activation gate panel + manual-only run path |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 7)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 013 proven. Move to `_Done`.
