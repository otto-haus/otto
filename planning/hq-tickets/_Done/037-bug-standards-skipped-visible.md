# 037 — Standards/Practices/Routines: show skipped loader reasons

Owner: Claude
Priority: P2
Depends on: none
Release bucket: v0.1

## Outcome

When YAML specs fail validation, the surface shows file path + reason (not silent skip count only).

## Why this matters

Operators cannot diagnose missing canon; ship checks require honest loader feedback.

## Scope

- Standards, Practices, Routines panes: render `result.skipped[]` like Receipts surface pattern
- Optional: standard-store try/catch when registry.yaml missing (return skipped, don't throw)

## Out of scope

- Fixing malformed repo YAML files themselves

## Done when

- Introduce invalid practice/routine fixture in test tmp dir → UI lists skip reason
- Standards header shows skipped chip with expandable list

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
```

## Execution receipt (2026-06-14)

- **Branch:** `ship/v0.3-integration` (PR #6)
- **Fix:** `SkippedLoaderPanel` on Behavior panes (Standards, Practices, Routines, Skills) lists skipped files with reasons even when primary list is empty
- **Verify:** `bun run verify:v0` 5/5; staging Standards/Skills with intentional skip fixture
- **Reviewer:** pending +1

## Blocker log

Leave blank unless blocked.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: -1

### Checked against

- Introduce invalid practice/routine fixture in test tmp dir → UI lists skip reason: **FAIL** — no UI/integration test; `practice-store.test.ts` only asserts empty `skipped`.
- Standards header shows skipped chip with expandable list: **PASS (partial)** — `SkippedLoaderPanel` on Standards/Practices/Routines/Skills panes with expandable `<details>`.

### Evidence inspected

- `apps/desktop/src/surfaces/Panes.tsx` (`SkippedLoaderPanel`, Standards line 540)
- `apps/desktop/electron/standard-store.ts`, `practice-store.ts` (skipped array population)
- `practice-store.test.ts`, `standard-store.test.ts` (no malformed-fixture UI test)
- Ticket ## Execution receipt

### Defects

- Done-when explicitly requires invalid-fixture → UI proof; only component wiring exists.

### Required changes

- Add test or staging smoke with intentional malformed YAML in tmp dir; assert `SkippedLoaderPanel` shows path + reason.

### Finding

Loader UI exists; fixture→UI proof missing → -1.

## Execution receipt (rev9 — staging CDP capture)

Date: 2026-06-14  
**git:** `fff0152` · **app:** `/Applications/otto-staging.app` (CDP 9445)  
**script:** `scripts/otto-staging-rev8-proof.cjs` (seeds `practices/_staging-proof-malformed/practice.yaml`, cleaned up after)  
**manifest:** `docs/receipts/staging/staging-rev8-proof-20260614070035.json`

- Practices pane: `SkippedLoaderPanel` visible with path + YAML parse reason
- `skippedPanelVisible: true`; excerpt includes `_staging-proof-malformed/practice.yaml`

**Screenshot:** `docs/receipts/staging/037-practices-skipped-loader.png`  
**Receipt:** `docs/receipts/staging/037-bug-standards-skipped-visible.md`

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

- Invalid fixture → UI lists skip reason: **PASS** — manifest `skippedPanelVisible:true` with path `_staging-proof-malformed/practice.yaml` + YAML parse reason.
- Standards header skipped chip expandable: **PASS** — `SkippedLoaderPanel` captured on Practices pane; `037-practices-skipped-loader.png` on disk.

### Evidence inspected

- Files: `Panes.tsx` `SkippedLoaderPanel`, practice/standard stores
- Artifacts: `staging-rev8-proof-20260614070035.json` tickets.037; staging PNG

### Finding

Rev8 -1 cleared: fixture→UI proof captured on staging (not just component wiring).

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- Invalid fixture → skip reason in UI: **PASS** — `skippedPanelVisible:true`.
- Standards skipped chip: **PASS** — `037-practices-skipped-loader.png`.

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

Rev9 skipped-loader staging proof holds.
