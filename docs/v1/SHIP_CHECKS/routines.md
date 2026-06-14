# Ship Check — Routines

## Implementation status (2026-06-13)

Ship decision: **Ship as Proposed**

- [x] Routine specs + templates under `routines/`
- [x] Routines store + desktop surface; recurring activation gated
- [x] Smoke: `otto-012-routines-contract-smoke-20260613T223000.json`
- [~] Manual inspection/run only — no automated executor
- [ ] Demo + repo receipt not refreshed

## Spec promise

Routines are repeated bundles of Practices. Recurring routines require approval because attention is a one-way door.

## Required file contract

- [ ] Routine type exists in core contract.
- [ ] Routine specs exist under `routines/*/routine.yaml`.
- [ ] Templates exist: `routines/_templates/routine.yaml`, `run.yaml`, `receipt.md`.
- [ ] Docs exist: `docs/routines.md`, `docs/routine-mining.md`.
- [ ] Skill/extension exists if claimed.

## Required runtime behavior

- [ ] Routines can be inspected locally.
- [ ] Recurring activation requires approval.
- [ ] One-off trials are distinguished from standing routines.
- [ ] Runs/receipts are defined even if manual.

## Required tests

- [ ] Routine specs are validated or manually checked.
- [ ] If no runtime executor, mark Partial.

## Required demo

- [ ] `demo/out/otto-v01-routines.mp4` shows routine specs/templates and approval boundary.

## Required receipt

- [ ] `receipts/otto-v01/routines.md` states whether runtime executor exists.

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
