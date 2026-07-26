# Shipping loop tick 029

**At:** 2026-07-26T01:03:00Z  
**Mode:** full (global agents ~29, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~29 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | #921 babysit receipt (tick 025/#923) respected; no in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 34 (file paths in `state.yaml` collision_map; added #926)

**Ready issues (p0→p3):** 0

- `gh issue list --label "status: ready"` → empty

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 1

| PR | Status | Action |
|---|---|---|
| #926 | DRAFT, red CI (`bun audit` — 23 vulns; dream-settings tests pass) | **babysit inline** — carry tick 025 audit overrides + postcss override onto tick 029 branch |
| #925 | DRAFT, red CI | skip — superseded by tick 029 stack |
| #921 | MERGEABLE, BLOCKED, red CI on dependabot head | **skip spawn** — fix proven on #923; awaiting Sebastian cherry-pick |
| #922, #916, #917 | DRAFT, red CI | skip — superseded by #918–#924/#923 stack |
| #923, #924 | DRAFT, CI green | skip — prior tick stack; superseded by tick 029 |
| #892–#906 (non-draft) | CI green, BLOCKED | skip — awaiting Sebastian review gate |

**Notes:**

- #926 CI failure root cause was `bun audit` (not dream-settings — tick 028 fix landed but audit overrides were missing).
- Applied tick 025 override set plus `postcss >=8.5.18` and tightened `brace-expansion`/`js-yaml` pins; local `bun audit` → clean.
- `collision_map` extended for #926.

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 34 open PRs remain `BLOCKED`.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: —
Waiting on merge_prep: #921 (cherry-pick sdk+audit fix from #923 / tick 025 branch, or prefer #905 stack)
CI-green, review gate BLOCKED: #892, #893, #894, #897, #905, #906
Orchestrator meta (draft): tick 029 on branch cursor/unified-shipping-loop-orchestrator-86f5 — audit overrides + dream-settings CI fix
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
```

## Follow-ups

1. Intake blocked until Ready marker visible on issues.
2. Ship_review activates when `mergeStateStatus` → CLEAN after Sebastian approval.
3. Cherry-pick tick 025 sdk+audit stack from #923 into #921 dependabot branch.
4. Consolidate orchestrator draft PRs (#890–#926) after Sebastian picks canonical tick branch.
