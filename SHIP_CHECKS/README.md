# Otto Ship Checks (legacy mirror)

**Canonical ship checks:** `docs/v1/SHIP_CHECKS/` — edit there first.

This root `SHIP_CHECKS/` directory is a **read-only mirror** for scripts and older links (`verify:v0` allow-list, PR-C split). When `docs/v1/SHIP_CHECKS/*` changes, sync the matching file here or replace with a one-line pointer.

Master status table: `docs/v1/SHIP_STATUS.md`

## How to use

For each surface:
1. Check the file contract.
2. Check runtime behavior.
3. Check Desktop surface.
4. Check tests.
5. Check demo.
6. Check receipt.
7. Decide: Ship / Proposed / Defer / Cut.

## Files

- `namespace.md`
- `desktop.md`
- `charter.md`
- `practices.md`
- `routines.md`
- `standards.md`
- `curation.md`
- `approvals.md`
- `autonomy.md`
- `tickets.md`
- `skills.md`
- `knowledge.md`
- `channels.md`
- `runs-receipts.md`
- `worker-orchestration.md`
- `release-gate.md`

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
