# 014 — Curation: Proposal Contract

Owner: Codex
Priority: P0
Depends on: 004, 008, 010

## Outcome

Corrections and lessons become explicit proposals, not silent behavior changes.

## Scope

- Proposal model.
- Source/evidence reference.
- Consequence classification.
- Target canon object: Standard, Practice, Routine, memory/writeback, etc.

## Done when

- User correction can create a proposal.
- Proposal includes rationale and evidence/source.
- Proposal has consequence classification.
- Proposal does not change canon by existing.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `014` depends on `004`, `008`, and `010`; none are in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../014-curation-proposal-contract.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependencies `004`, `008`, and `010` are not accepted.

### Required changes

- Complete and accept `004`, `008`, and `010` into `_Done`.
- Implement ticket `014`.
- Append an execution receipt proving correction-to-proposal, rationale/evidence, consequence classification, and no silent canon mutation.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 22:45 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- `packages/core/src/types.ts`: `otto.proposal.v1` model — source, evidence, target, classification, status.
- `apps/desktop/electron/proposal-store.ts`: file-backed proposals under `~/.otto/curation/proposals/`; `createFromCorrection()` writes receipt; `classifyProposal()` routes canon changes to human ratification without touching canon files.
- IPC + preload: `otto:curation:proposals:list|get|create-from-correction`; `window.otto.curation.proposals.*`.
- `proposal-store.test.ts`: correction → proposal + receipt; canon mtime unchanged; reload persisted record.

## Verification

- Smoke: `/Users/seb/.codex/admin/otto-014-curation-proposal-contract-smoke-20260613T223000.json`
- `bun test ./electron/*.test.ts` → 17 pass
- `bun run typecheck` → pass

## Done when mapping

| Done when | Proof |
|---|---|
| User correction can create a proposal | `createFromCorrection()` + smoke `proposal.id` |
| Proposal includes rationale and evidence/source | smoke `evidenceCount: 2`; receipt + correction refs |
| Proposal has consequence classification | smoke `classification.required_gate: human_ratification` |
| Proposal does not change canon by existing | smoke `noSilentCanonMutation: true`; test asserts practice.yaml mtime unchanged |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 8)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 014 proven. Move to `_Done`. UI inbox remains ticket 015.
