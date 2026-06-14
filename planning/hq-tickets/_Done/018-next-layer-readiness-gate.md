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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: -1

### Checked against

- Gate question ("add Intake/Paperclip/Discord without changing authority model?"): **UNPROVEN** — cannot answer yes while 017 is fake-done and 001 connected proof is worktree-bound.
- Letta readiness truthful: **PARTIAL** — code OK; smoke cites worktree 001 artifact.
- Chat real adapter: **PASS** — 002 smoke + code.
- Receipts success/blockers: **PASS** — 004 smoke.
- Canon file-backed S/P/R: **PASS** — stores + dirs.
- Correction → behavior: **PASS** — 016 staging smoke.
- Consequential requires approval: **UNPROVEN at ticket level** — 017 fake-done (code exists).
- Adapter seam documented: **PASS** — `docs/v1/contracts/adapter-seam.md`.

### Evidence inspected

- Files: `docs/v1/contracts/adapter-seam.md`, `_Done/001`–`017` tickets, core stores
- Artifacts: `otto-018-readiness-gate-smoke-20260614T040000.json` (`ok: true`, worktree path)
- Commands: 42-test spot-check pass; no staging artifacts for 001–018 in repo

### Defects

- Gate smoke chains unproven prerequisites (001 worktree, 017 no ticket receipt).
- Prior +1 on 018 predates rev8 finding on 017.

### Required changes

- Fix 017 proof gap; regenerate canonical 001 smoke.
- Re-run gate only after rev8 `+1` on all of 001–017.

### Finding

Documentation and most subsystems are ready, but the gate cannot be certified while dependency 017 lacks ticket-level proof.

## Execution rev9

Status: pass (gate re-run after 017 receipt + canonical 001 smoke)
Date: 2026-06-14
Repo: `/Users/seb/Code/otto`
Git: `fff0152`

### Gate walkthrough (rev9)

| Check | Pass | Evidence |
|---|---|---|
| Letta readiness truthful | yes | `docs/receipts/staging/001-connected-settings-smoke-20260614T065758Z.json` (`repo=/Users/seb/Code/otto`, `runtimeReady=true`, disposable `local-conv-*`) |
| Chat real adapter path | yes | prior `otto-002-chat-send-smoke-*` + runtime `transportMode=sdk` in 001 smoke |
| Receipts success + blockers | yes | `autonomy-store.test.ts` blocked/success receipts; receipt contract smokes |
| Canon file-backed (S/P/R) | yes | `standards/`, `practices/`, `routines/` + store loaders |
| Correction → proposal → decision → behavior | yes | curation smokes 014–016 |
| Consequential requires approval | yes | `017-autonomy-policy.md` ## Execution receipt; `autonomy-store.test.ts` 11 pass |
| Adapter seam documented | yes | `docs/v1/contracts/adapter-seam.md` |

### Verification

```sh
bun test apps/desktop/electron/autonomy-store.test.ts  # 11 pass
```

Staging artifact bundle: `docs/receipts/staging/001-connected-settings-smoke-20260614T065758Z.json` (+ PNG).

### Done when answer (rev9)

```txt
Can we now add Intake/Paperclip/Discord as adapters without changing Otto's authority model?
→ yes (017 ticket-level proof now mapped; 001 connected proof from canonical repo)
```

Cognee live-ready (041–044) remains partial — does not block adapter authority model.

Reviewer verdict: pending re-review after rev9.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

- Gate question (add Intake/Paperclip/Discord without changing authority model?): **PASS** — yes, with 001 canonical smoke + 017 ticket receipt now mapped.
- Letta readiness truthful: **PASS** — `docs/receipts/staging/001-connected-settings-smoke-20260614T065758Z.json`.
- Chat real adapter path: **PASS** — prior 002 smoke + sdk transport in 001 smoke.
- Receipts success/blockers: **PASS** — receipt contract smokes + autonomy blocked/success receipts.
- Canon file-backed S/P/R: **PASS** — dirs + store loaders.
- Correction → proposal → decision → behavior: **PASS** — 014–016 smokes.
- Consequential requires approval: **PASS** — 017 execution receipt + 11 autonomy tests.
- Adapter seam documented: **PASS** — `docs/v1/contracts/adapter-seam.md`.

### Evidence inspected

- Files: adapter-seam doc, `_Done/001`–`017`, core stores
- Artifacts: 001 canonical staging smoke; `## Execution rev9` gate table
- Commands: autonomy-store 11 pass

### Finding

Rev8 -1 cleared: prerequisite 017 proof gap and 001 worktree smoke superseded by rev9 artifacts.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- Gate question (add adapters without changing authority model?): **PASS** — yes; 001 canonical smoke + 017 receipt mapped rev9.
- Letta readiness truthful: **PASS** — `001-connected-settings-smoke-20260614T065758Z.json`.
- Chat real adapter path: **PASS** — 002 smoke + sdk transport in 001 smoke.
- Receipts success/blockers: **PASS** — receipt contract + autonomy receipts.
- Canon file-backed S/P/R: **PASS** — dirs + store loaders.
- Correction → proposal → decision → behavior: **PASS** — 014–016 smokes.
- Consequential requires approval: **PASS** — 017 execution receipt; 11 autonomy tests.
- Adapter seam documented: **PASS** — `docs/v1/contracts/adapter-seam.md`.

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

No rev10 execution receipt; rev9 Done-when mapping and artifacts hold.
