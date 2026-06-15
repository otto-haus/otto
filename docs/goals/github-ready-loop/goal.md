# Goal: GitHub Ready implementation loop

## Charter

**Original request:** Agent loops on `otto-haus/otto` should keep moving Ready issues while individual PRs wait at review or merge gates.

**Interpreted outcome:** Each Ready issue gets a smallest-correct PR and proof, then stops at **In review** for that issue only. The PM loop immediately selects the next **file-disjoint** Ready issue. Merge/review gates never pause the whole lane.

**Goal oracle:** Per issue — PR linked (`Fixes #N`), credible proof, issue in **In review**, independent reviewer `+1` before Done. Lane throughput — `active_task` stays populated unless no safe disjoint work exists.

### Operating contract

- **Work items:** GitHub Issues; priority `p0` → `p1` → `p2` → `p3`.
- **Workflow:** Project status Backlog → Ready → In progress → In review → Done (labels when GraphQL unavailable).
- **Per-ticket gates:** Review and merge block **that PR only**. Continue scouting/implementing disjoint Ready issues.
- **Collisions:** If every Ready issue shares files with an open PR, record `no_safe_work` with the collision map — do not stall silently.
- **Board:** `one_active_task: true` unless `no_safe_work` is documented.
- **Handoff:** Awaiting PRs listed separately from active next work (see `docs/agent-goals/README.md`).

### Likely misfire to avoid

Setting `active_task: null` after opening a PR; waiting for merge before picking the next Ready issue; using Project V2 GraphQL in a per-item hot loop.

## Proof type

`review` + `test` + receipts in `notes/`

## Authority

`approved` — Fixes #345.
