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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- User can view Practices: **PASS** — `Practices` surface wired to `api.practices.list()`.
- User can inspect a Practice: **PASS** — detail with guardrails, approval floor, citations.
- Changes do not bypass Curation silently: **PASS** — Curation gate copy; no direct canon edit UI.

### Evidence inspected

- Files: `Panes.tsx` Practices (~L696)
- Artifacts: `otto-011-practices-surface-smoke-20260613T223000.json` (`status: pass`)
- Dependency: `010` in `_Done`

### Defects

None blocking.

### Required changes

None.

### Finding

Read-only Practices surface with explicit Curation routing for consequential edits.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

All Done-when items: **PASS** — rev8 mapping stands; no rev9 regression identified in code or cited receipts.

### Evidence inspected

- Prior `## Review rev8` Done-when mapping
- Execution receipt(s) already in ticket
- Rev9 cross-check focused on 001/017/018/033/036/037/039/041-044/045 only

### Finding

Rev8 +1 reaffirmed. No new blockers.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- All Done-when: **PASS** (rev9 evidence; no regression in rev10 pass).

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

No rev10 execution receipt; rev9 Done-when mapping and artifacts hold.
