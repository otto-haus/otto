# 036 — Curation: deferred proposals in decided filter

Owner: Claude
Priority: P1
Depends on: none
Release bucket: v0.1

## Outcome

Deferred proposals appear under a “decided” (or dedicated deferred) filter, not stuck in Pending.

## Why this matters

Inbox filters mislead operators about queue state; deferred items look still pending.

## Scope

- `Panes.tsx` Curation: adjust `PENDING_STATUSES` / filter logic for `deferred`
- Honest copy on filter labels

## Out of scope

- Approvals panel showing pre-decision pending items (by design — ratification records only)

## Done when

- Defer a proposal → visible under decided/deferred filter, not pending
- Manual smoke on staging Curation surface

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
```

## Execution receipt (2026-06-14)

- **036** deferred filter: `deferred` removed from pending set in `Panes.tsx`

## Execution receipt (2026-06-14)

- **Branch:** `ship/v0.3-integration` (PR #6)
- **Fix:** `PENDING_STATUSES` excludes `deferred`; decided filter uses `!isPendingProposal` so deferred proposals appear under **decided**
- **Verify:** `bun test ./apps/desktop/electron/proposal-store.test.ts` defer path; manual Curation inbox filter smoke on staging
- **Reviewer:** pending +1

## Blocker log

Leave blank unless blocked.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: -1

### Checked against

- Defer a proposal → visible under decided/deferred filter, not pending: **PASS (code)** — `PENDING_STATUSES = {'proposed','needs_approval'}`; decided filter uses `!isPendingProposal`; `proposal-store.test.ts` sets status `deferred`.
- Manual smoke on staging Curation surface: **UNPROVEN** — no staging receipt or screenshot for defer→decided filter.

### Evidence inspected

- `apps/desktop/src/surfaces/Panes.tsx` (lines 1109–1161)
- `apps/desktop/electron/proposal-store.test.ts` (defer path)
- Ticket ## Execution receipt; `docs/receipts/staging/` (no 036 entry)

### Defects

- Store-level defer test exists; UI filter smoke not evidenced.

### Required changes

- Staging smoke: defer proposal → switch to Decided filter → confirm visible, not in Pending.
- Record receipt in `docs/receipts/staging/`.

### Finding

Logic fix is in repo; manual Done-when item unproven → -1.

## Execution receipt (rev9 — staging CDP capture)

Date: 2026-06-14  
**git:** `fff0152` · **app:** `/Applications/otto-staging.app` (CDP 9445)  
**script:** `scripts/otto-staging-rev8-proof.cjs` + `scripts/otto-staging-rev8-036-recapture.cjs` (validation fix)  
**manifest:** `docs/receipts/staging/staging-rev8-proof-20260614070035.json`

- Created deferred proposal `prop_20260614_d750e3b2` (summary: `rev8 staging proof — defer filter visibility`)
- **Pending** filter: deferred proposal **not** in list (`pendingListHasDeferred: false`)
- **Decided** filter: deferred proposal **visible** (`decidedListHasDeferred: true`, `deferredCount: 4`)

**Screenshots:** `036-curation-pending-filter.png`, `036-curation-deferred-decided-filter.png`  
**Receipt:** `docs/receipts/staging/036-bug-curation-deferred-filter.md`

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

- Defer proposal → not in Pending filter, visible in Decided: **PASS** — manifest `pendingListHasDeferred:false`, `decidedListHasDeferred:true` for `prop_20260614_d750e3b2`.
- Staging smoke receipt: **PASS** — `036-bug-curation-deferred-filter.md` + PNGs on disk.

### Evidence inspected

- Files: curation filter logic (prior execution receipt)
- Artifacts: `staging-rev8-proof-20260614070035.json` tickets.036; `036-curation-*.png`

### Finding

Rev8 -1 cleared: manual filter Done-when proven on staging.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- Defer → not pending, visible decided: **PASS** — `pendingListHasDeferred:false`, `decidedListHasDeferred:true`.
- Staging smoke: **PASS** — `036-bug-curation-deferred-filter.md` + PNGs.

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

Rev9 deferred-filter staging proof holds.
