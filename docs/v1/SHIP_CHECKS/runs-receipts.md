# Ship Check — Runs and Receipts

## Implementation status (2026-06-13)

Ship decision: **Ship in v0.1**

- [x] Run + Receipt types in `packages/core/src/types.ts`
- [x] Receipt store + IPC + Receipts surface
- [x] Success/failure/blocker receipts durable
- [x] Smoke: `otto-004-receipt-smoke-20260614T032125Z.json`, `otto-005-receipts-smoke-20260613T204500.json`
- [~] Per-feature `receipts/otto-v01/*.md` in repo not refreshed this wave

## Spec promise

Runs are executions. Receipts are proof. No artifact, no progress. Done requires mapped proof.

## Required file contract

- [ ] Run type exists in core.
- [ ] Receipt type exists in core.
- [ ] Run template exists.
- [ ] Receipt template exists.
- [ ] Per-feature release receipts exist.

## Required runtime behavior

- [ ] Each shipped feature produces a receipt or documented proof artifact.
- [ ] Completion maps to evidence.
- [ ] Approval gates record decisions.
- [ ] If runtime run creation is manual/file-backed, say so.

## Required Desktop surface

- [ ] Desktop Receipts surface shows runs/proof/history or clearly marks sample/prototype.

## Required checks

- [ ] `receipts/otto-v01/*.md` exist for every shipped/proposed feature.
- [ ] `RELEASE_CHECKLIST.md` links receipts.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
