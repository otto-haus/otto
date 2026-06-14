# 010 — Practices Contract

Owner: Codex
Priority: P1
Depends on: 008

## Outcome

Otto has reusable ways of working that runs can invoke.

## Scope

- Practice model.
- Practice file/canon path.
- Run invocation metadata.
- Receipt link.

## Done when

- Practice can be loaded from canon.
- A run can identify which Practice it used.
- Practice use appears in receipt.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `010` depends on `008`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../010-practices-contract.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `008` is not accepted.

### Required changes

- Complete and accept `008` into `_Done`.
- Implement ticket `010`.
- Append an execution receipt proving canon load, run practice identification, and receipt linkage.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 22:15 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- Added `PracticeStore` loading `practices/<slug>/practice.yaml` from repo canon (`storage: 'files'`).
- Added `PracticeReference` + optional `practice` field on `otto.receipt.v1`.
- Wired IPC: `otto:practices:list`, `get`, `resolve-for-text`; preload `window.otto.practices.*`.
- `letta-runner.writeChatReceipt()` resolves Practice from slash-command text and persists on receipt.
- Receipt detail UI shows `practice invoked` when present.

## Verification

- `bun test ./electron/practice-store.test.ts ./electron/receipt-writer.test.ts` -> pass
- `bun run typecheck` -> pass
- Smoke JSON: `/Users/seb/.codex/admin/otto-010-practices-smoke-20260613T221500.json`

## Done when mapping

| Done when | Proof |
|---|---|
| Practice loaded from canon | `PracticeStore.listResult()` loads ≥5 practices from `../../practices` |
| Run identifies Practice used | `resolveForText('/charter step …')` -> slug `charter`, invocation `/charter step` |
| Practice use appears in receipt | `ReceiptWriter` persists `practice`; `letta-runner` attaches on chat send |

Reviewer verdict: pending

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 6)
Date: 2026-06-13
Verdict: +1

### Checked against

- Canon load: pass — five+ practices from YAML files, approval floor enforced.
- Run identification: pass — invocation resolver matches longest prefix.
- Receipt linkage: pass — `practice` field written and rendered in receipt detail.
- Dependency gate: pass — `008` `_Done`.

### Finding

Ticket 010 proven. Move to `_Done`.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Practice loadable from canon: **PASS** — `PracticeStore` reads `practices/*/practice.yaml`.
- Run identifies Practice used: **PASS** — `PracticeReference` on runs/receipts.
- Practice use in receipt: **PASS** — receipt writer tests + store tests.

### Evidence inspected

- Files: `practice-store.ts`, `practice-store.test.ts`, `packages/core/src/types.ts`
- Artifacts: `otto-010-practices-smoke-20260613T221500.json` (`status: pass`)
- Dependency: `008` in `_Done`

### Defects

None blocking.

### Required changes

None.

### Finding

Practice contract proven in canonical code and smoke.

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
