# Ship Check — Charter

## Implementation status (2026-06-13)

Ship decision: **Ship as Proposed**

- [x] Charter store + Charters desktop surface
- [x] Smoke: `otto-007-charters-smoke-20260613T210700.json`
- [~] Full extension CLI/templates path partial vs spec file contract
- [ ] Demo + `receipts/otto-v01/charter.md` not refreshed

## Spec promise

Charters define the bet: operating contracts for autonomous work with state, gates, ledger, and receipts.

## Required file contract

- [ ] Extension command exists: `extension/charter.ts`.
- [ ] Skill exists: `skill/SKILL.md`.
- [ ] Templates exist: `templates/charter.yaml`, `templates/state.yaml`, `templates/ledger.md`, `templates/approval.yaml`, `templates/charter.md`.
- [ ] Example charter exists under `examples/`.
- [ ] Runtime spec exists in `docs/runtime-spec.md` or equivalent.

## Required runtime behavior

- [ ] Can create/propose a Charter from messy intent.
- [ ] Can inspect status/state.
- [ ] Gates one-way doors.
- [ ] Persists approval records.
- [ ] Completion requires AC-by-AC receipt proof.

## Required tests

- [ ] Typecheck passes.
- [ ] Manual charter flow documented if no automated test.

## Required demo

- [ ] `demo/out/otto-v01-charter.mp4` shows real charter artifacts/state path, not generic marketing.

## Required receipt

- [ ] `receipts/otto-v01/charter.md` maps what changed, tests, demo, limitations, approval status.

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
