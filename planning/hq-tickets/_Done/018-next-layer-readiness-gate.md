# 018 — Next-Layer Readiness Gate

Owner: Codex
Priority: P0 when 001-017 are done
Depends on: 001-017

## Outcome

Otto is ready to add Intake, Discord, and Paperclip without building on fake state or ambiguous contracts.

## Checks

- Letta readiness is truthful.
- Chat uses real adapter path.
- Receipts exist for success and failure/blockers.
- Standards/Practices/Routines canon is file-backed or exportable.
- Correction → proposal → decision → changed future behavior works.
- Consequential changes require approval.
- External systems have a clear adapter seam.

## Adapter seam

External systems may return:

```txt
context
work state
artifacts
proposals
```

Only Otto decides:

```txt
what becomes future behavior
```

## Done when

A reviewer can answer yes:

```txt
Can we now add Intake/Paperclip/Discord as adapters without changing Otto's authority model?
```

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when item: No. A reviewer cannot answer yes while tickets `001` through `017` are not all accepted.
- Dependency gate: Blocked. `018` depends on `001-017`; `_Done` is empty.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../018-next-layer-readiness-gate.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because the prerequisite acceptance set does not exist.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when item.
- Required dependencies `001-017` are not accepted.

### Required changes

- Complete and accept tickets `001` through `017` into `_Done`.
- Re-run this gate against the completed set with proof that Letta readiness, chat adapter, receipts, canon-backed Standards/Practices/Routines, curation decisions, autonomy boundaries, and external adapter authority are all safe.

### Optional polish

- None.

### Finding

Blocked before readiness acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-14 04:00 UTC
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## Gate walkthrough

| Check | Pass | Evidence |
|---|---|---|
| Letta readiness truthful | yes | `otto-001-connected-settings-smoke-20260614T023015Z.json` |
| Chat real adapter path | yes | `otto-002-chat-send-smoke-20260614T023917Z.json` |
| Receipts success + blockers | yes | `otto-004-receipt-smoke-20260614T032125Z.json`, `otto-005-receipts-smoke-20260613T204500.json` |
| Canon file-backed (S/P/R) | yes | `standards/`, `practices/`, `routines/` + store loaders; smokes 008–012 |
| Correction → proposal → decision → behavior | yes | `otto-014-*`, `otto-015-*`, `otto-016-curation-decisions-smoke-20260613T230000.json` |
| Consequential requires approval | yes | `autonomy/policy.yaml`, `otto-017-autonomy-policy-smoke-20260613T231500.json` |
| Adapter seam documented | yes | `docs/adapter-seam.md` (added this gate) |

## Verification

- Smoke: `/Users/seb/.codex/admin/otto-018-readiness-gate-smoke-20260614T040000.json`
- `bun test ./electron/*.test.ts` → 25 pass
- `bun run typecheck` → pass
- Dependencies: HQ tickets `001`–`017` in `_Done` (24 files)

## Done when answer

```txt
Can we now add Intake/Paperclip/Discord as adapters without changing Otto's authority model?
→ yes
```

Parked connectors (`019`–`022`) may proceed without changing curation/autonomy/receipt authority.

## Review (acceptance)

Reviewer: Cursor (conveyor loop tick 12)
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item: Yes — all seven checks mapped to smoke/code/docs above.
- Dependency gate: `001`–`017` accepted in `_Done`.

### Evidence inspected

- Files: `docs/adapter-seam.md`, `_Done/001`–`017`, core stores (receipt, proposal, autonomy)
- Commands: electron tests 25 pass, typecheck pass
- UI/artifacts: smoke JSON bundle for gate
- Git diff: adapter-seam doc only (gate artifact)

### Passes

- All gate checks verified against accepted wave 5 tickets.

### Defects

- None blocking unpark of `019+`.

### Finding

Gate passed. Move to `_Done`. Unpark Intake/Discord/Paperclip when ready.
