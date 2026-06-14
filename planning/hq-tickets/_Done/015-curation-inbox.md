# 015 — Curation Inbox

Owner: Claude
Priority: P0
Depends on: 014

## Outcome

User can see pending behavior/canon proposals.

## Scope

- Curation inbox surface.
- Proposal list.
- Proposal detail.
- Status: pending/accepted/rejected/deferred.

## Done when

- Pending proposals are visible.
- User can inspect rationale/evidence.
- Inbox distinguishes pending vs decided proposals.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `015` depends on `014`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../015-curation-inbox.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `014` is not accepted.

### Required changes

- Complete and accept `014` into `_Done`.
- Implement ticket `015`.
- Append an execution receipt proving proposal visibility, rationale/evidence inspection, and pending-vs-decided status separation.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 22:50 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- `Panes.tsx` `Curation`: inbox wired to `window.otto.curation.proposals.list()`.
- Proposal list with pending / decided / all filters; detail shows rationale, evidence, classification.
- Empty states distinguish web preview vs desktop file-backed store.

## Verification

- Smoke: `/Users/seb/.codex/admin/otto-015-curation-inbox-smoke-20260613T223000.json`
- `bun run typecheck` → pass
- Contract proof inherited from 014 smoke (proposals listable via same IPC)

## Done when mapping

| Done when | Proof |
|---|---|
| Pending proposals are visible | pending filter + `needs_approval` / `proposed` statuses |
| User can inspect rationale/evidence | ProposalDetail panels |
| Inbox distinguishes pending vs decided | pending / decided filter tabs + counts |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 8)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 015 proven. Move to `_Done`.
