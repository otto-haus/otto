# Ship Check — Worker Orchestration

## Spec promise

Main Otto orchestrates ticket workers in worktrees. Workers own bounded execution; Otto owns routing, tracking, review, integration, and escalation.

## Required file contract

- [ ] Worker packet template exists.
- [ ] Ticket template exists.
- [ ] Worktree policy exists.
- [ ] Integration/merge policy exists.
- [ ] Receipt requirement exists.

## Required runtime behavior

- [ ] Can create or document worker-ready tickets.
- [ ] Can track worker status.
- [ ] Can integrate/review worker results.
- [ ] Escalates consequential doors.

## v0.1 status guidance

If orchestration is manual via Claude/worktrees, mark Manual/Partial, not fully runtime-shipped.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
