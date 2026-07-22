# Shipping loop tick 025

**At:** 2026-07-22T01:02:01Z  
**Mode:** full (global agents ~25, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~25 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | tick 024 #921 SDK fix receipt respected; no in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 30 (file paths in `state.yaml` collision_map)

**Ready issues (p0→p3):** 0

- `gh issue list --label "status: ready"` → empty

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 1

| PR | Status | Action |
|---|---|---|
| #921 | MERGEABLE, BLOCKED, red CI (`checks` + `scheduled-checks` FAILURE) | **babysit** — carry tick 024 SDK fix + expanded audit overrides on tick 025 branch |
| #922 | DRAFT, red CI (`checks` audit FAILURE) | **babysit** — tick 024 meta missed tar/brace-expansion/js-yaml/fast-uri/sharp overrides |
| #916, #917 | DRAFT, red CI | skip — superseded by #918/#919/#920/#922 stack |
| #920 | DRAFT, CI green | skip — superseded by tick 025 branch |
| #892–#906 (non-draft) | CI green, BLOCKED | skip — awaiting Sebastian review gate |

**Notes:**

- Tick 024 SDK 0.2.x fix (`sdk-subprocess-transport.ts`) verified locally: `electron:typecheck` pass.
- Tick 024 CI failed on `bun audit` (8 vulns on bumped deps); tick 025 adds overrides: `dompurify`, `undici`, `tar`, `brace-expansion`, `js-yaml`, `fast-uri`, `sharp`.
- Local verify: `bun audit` → no vulnerabilities; `electron:typecheck` → pass.
- Receipt: `docs/receipts/merge-queue-pr-921.md` (updated tick 025)

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 30 open PRs remain `BLOCKED`.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: —
Waiting on merge_prep: #921 (SDK+audit fix on tick 025 branch; cherry-pick into dependabot or prefer #905 stack)
CI-green, review gate BLOCKED: #892, #893, #894, #897, #905, #906
Orchestrator meta (draft, CI green): #920 — superseded by tick 025 branch pending CI
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
Orchestrator meta: tick 025 on branch cursor/unified-shipping-loop-orchestrator-0dd5
```

## Follow-ups

1. Intake blocked until Ready marker visible on issues.
2. Ship_review activates when `mergeStateStatus` → CLEAN after Sebastian approval.
3. Apply tick 025 sdk+audit stack to #921 dependabot branch or merge #905 + overrides.
4. Consolidate orchestrator draft PRs (#890–#922) after Sebastian picks canonical tick branch.
