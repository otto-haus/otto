# Shipping loop tick 017

**At:** 2026-07-14T01:03:00Z  
**Mode:** full (global agents ~17, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~17 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | read #909, #911 receipts; dedupe respected; no prior in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 22 (file paths in `state.yaml` collision_map)

**Ready issues (p0→p3):** 0

- `gh issue list --label "Ready"` → empty
- `gh issue list --label "status:ready"` → empty
- `gh issue list --label "trunk-ready"` → empty
- 29 open issues with p-labels but none carry a Ready workflow marker

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

**Collision map:** refreshed for #913 (orchestrator meta from tick 016).

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 0

| PR | Status | Action |
|---|---|---|
| #890–#913 | CI green, MERGEABLE, no CONFLICTING/DIRTY | skip — merge_prep queue empty |

**Notes:**

- All 22 open PRs have CI SUCCESS; none CONFLICTING or DIRTY.
- No babysit subagents spawned.

**Remaining queue:** empty.

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 22 open PRs remain `BLOCKED` (branch protection / review gate).

Non-draft dependabot PRs awaiting Sebastian review (CI green): #892, #893, #894, #897, #905, #906.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: —
Waiting on merge_prep: —
CI-green, review gate BLOCKED: #890, #892, #893, #894, #895, #897, #898, #899, #900, #901, #902, #903, #904, #905, #906, #907, #908, #909, #910, #911, #912, #913 (await Sebastian review / branch protection)
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
Orchestrator meta: this tick (#017) records state on branch cursor/unified-shipping-loop-orchestrator-4a37
```

## Follow-ups

1. Intake still blocked until Ready marker visible (`status:ready` label or Project V2 access).
2. Ship_review can score PRs when `mergeStateStatus` flips to CLEAN after Sebastian approval.
3. Non-draft dependabot PRs (#892, #893, #894, #897, #905, #906) remain CI-green — Sebastian merge gate only.
4. Consider marking draft orchestrator PRs ready-for-review or closing superseded ticks once Sebastian merges the latest orchestrator state.
