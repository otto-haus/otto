# Shipping loop tick 024

**At:** 2026-07-21T01:00:26Z  
**Mode:** full (global agents ~24, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~24 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | tick 023 #916/#917 superseded receipts respected; no in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 29 (file paths in `state.yaml` collision_map)

**Ready issues (p0→p3):** 0

- `gh issue list --label "status: ready"` → empty

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 1

| PR | Status | Action |
|---|---|---|
| #921 | MERGEABLE, BLOCKED, red CI (`checks` + `scheduled-checks` FAILURE) | **babysit** — SDK 0.2.x typecheck fix on tick 024 branch |
| #916, #917 | DRAFT, red CI | skip — superseded by #918/#919/#920 |
| #920 | DRAFT, CI green | skip — latest orchestrator meta before this tick |
| #892–#906 (non-draft) | CI green, BLOCKED | skip — awaiting Sebastian review gate |

**Notes:**

- #921 new dependabot bump (`letta-code@0.28.12`, `letta-code-sdk@^0.2.1`) breaks `electron:typecheck`; fix mirrors #905.
- Receipt: `docs/receipts/merge-queue-pr-921.md`
- Local verify: `electron:typecheck` pass on tick 024 branch.

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 29 open PRs remain `BLOCKED`.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: —
Waiting on merge_prep: #921 (sdk fix on tick 024 branch; cherry-pick into dependabot PR or close in favor of #905)
CI-green, review gate BLOCKED: #892, #893, #894, #897, #905, #906
Orchestrator meta (draft, CI green): #920 — superseded by tick 024 branch
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
Orchestrator meta: tick 024 on branch cursor/unified-shipping-loop-orchestrator-0eb3
```

## Follow-ups

1. Intake blocked until Ready marker visible on issues.
2. Ship_review activates when `mergeStateStatus` → CLEAN after Sebastian approval.
3. Apply tick 024 sdk fix to #921 dependabot branch or merge #905 stack.
4. Consolidate orchestrator draft PRs (#890–#920) after Sebastian picks canonical tick branch.
