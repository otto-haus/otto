# Shipping loop tick 027

**At:** 2026-07-24T01:02:00Z  
**Mode:** full (global agents ~32, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~32 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | #921 babysit receipt (tick 025/#923) respected; no in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 32 (file paths in `state.yaml` collision_map; added #923, #924)

**Ready issues (p0→p3):** 0

- `gh issue list --label "status: ready"` → empty

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 0

| PR | Status | Action |
|---|---|---|
| #921 | MERGEABLE, BLOCKED, red CI on dependabot head | **skip spawn** — fix proven on #923 (`202b8a6c9c24`); awaiting Sebastian cherry-pick |
| #922 | DRAFT, red CI | skip — superseded by #923/#924 tick stack |
| #916, #917 | DRAFT, red CI | skip — superseded by #918–#920/#923 stack |
| #923, #924 | DRAFT, CI green | skip — orchestrator meta; tick 025 babysit complete |
| #892–#906 (non-draft) | CI green, BLOCKED | skip — awaiting Sebastian review gate |

**Notes:**

- No new merge_prep work enqueued; red-CI PRs either covered by merge-queue receipts or superseded drafts.
- `collision_map` extended for #923 and #924.

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 32 open PRs remain `BLOCKED`.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: —
Waiting on merge_prep: #921 (cherry-pick sdk+audit fix from #923 / tick 025 branch, or prefer #905 stack)
CI-green, review gate BLOCKED: #892, #893, #894, #897, #905, #906
Orchestrator meta (draft, CI green): #924 — latest tick stack; prefer over #890–#923 draft stack
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
Orchestrator meta: tick 027 on branch cursor/unified-shipping-loop-orchestrator-7d71
```

## Follow-ups

1. Intake blocked until Ready marker visible on issues.
2. Ship_review activates when `mergeStateStatus` → CLEAN after Sebastian approval.
3. Cherry-pick tick 025 sdk+audit stack from #923 into #921 dependabot branch.
4. Consolidate orchestrator draft PRs (#890–#924) after Sebastian picks canonical tick branch.
