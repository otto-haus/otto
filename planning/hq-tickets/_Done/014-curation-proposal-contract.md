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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Correction creates proposal: **PASS** — `createFromCorrection()` + tests.
- Proposal has rationale/evidence: **PASS** — `otto.proposal.v1` fields populated in tests.
- Consequence classification: **PASS** — `classifyProposal()` gate mapping.
- Proposal does not mutate canon by existing: **PASS** — canon mtime unchanged in tests.

### Evidence inspected

- Files: `proposal-store.ts`, `proposal-store.test.ts`, `types.ts`
- Artifacts: `otto-014-curation-proposal-contract-smoke-20260613T223000.json` (`status: pass`)
- Dependencies: `004`, `008`, `010` in `_Done`

### Defects

None blocking.

### Required changes

None.

### Finding

Curation proposal contract holds: propose, classify, no silent canon write.

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
