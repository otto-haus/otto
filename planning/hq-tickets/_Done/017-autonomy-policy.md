# 017 — Autonomy Policy

Owner: Codex
Priority: P2
Depends on: 016

## Outcome

Otto can act independently only inside visible, approved boundaries.

## Scope

- Autonomy settings/policy.
- Safe vs consequential action boundary.
- Approval requirements.
- Receipt for autonomy decisions.

## Done when

- User can see what Otto may do alone.
- Consequential actions require approval.
- Autonomy decisions write receipts.
- App does not imply broader autonomy than implemented.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `017` depends on `016`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../017-autonomy-policy.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `016` is not accepted.

### Required changes

- Complete and accept `016` into `_Done`.
- Implement ticket `017`.
- Append an execution receipt proving visible autonomy scope, approval gate for consequential actions, autonomy decision receipts, and no overstated autonomy.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.
