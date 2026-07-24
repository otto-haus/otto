# Shipping loop tick 020

**At:** 2026-07-17T01:02:00Z  
**Mode:** full (global agents ~20, below defer threshold 45)  
**Orchestrator:** Lead shipping-loop (Cursor Automation cron)

## Preconditions

| Check | Result |
|---|---|
| `program.status` | active — proceed |
| Global agents | ~20 (< 45) — use `phase_budgets`, not defer |
| `docs/receipts/merge-queue-*` | no local receipts on main; dedupe respected; no prior in_flight_babysit |

## Phase 1 — intake

**Open PRs:** 25 (file paths in `state.yaml` collision_map)

**Ready issues (p0→p3):** 0

- `gh issue list --label "status: ready"` → empty
- `gh issue list --label "Ready"` → empty
- 29 open issues with p-labels but none carry a Ready workflow marker

**Decision:** `phase_state.intake.no_safe_work: true` — skip Worker spawn.

**Collision map:** refreshed for #916 (orchestrator meta from tick 019).

## Phase 2 — merge_prep

**Budget:** 2 — **spawned:** 1

| PR | Status | Action |
|---|---|---|
| #916 | MERGEABLE, BLOCKED, `checks=FAILURE` (bun audit: dompurify/undici) | babysit — audit overrides applied on tick 020 branch |
| #890–#915, #892–#906 | CI green, MERGEABLE, no CONFLICTING/DIRTY | skip |

**Notes:**

- Tick 019 (#916) was docs-only and omitted `package.json` audit overrides present in ticks 015–018.
- Applied root overrides: `dompurify ^3.4.11`, `undici >=7.28.0`; `bun audit` clean locally.
- Receipt: `docs/receipts/merge-queue-pr-916.md`
- Did not push to #916 branch (Worker charter required for foreign PR branches); fix lands on tick 020 branch `cursor/unified-shipping-loop-orchestrator-4487`.

**Remaining queue:** empty after tick 020 CI green.

## Phase 3 — ship_review

**Budget:** 2 — **spawned:** 0

Green lane requires `mergeStateStatus=CLEAN` + CI SUCCESS. All 25 open PRs remain `BLOCKED` (branch protection / review gate).

Non-draft dependabot PRs awaiting Sebastian review (CI green): #892, #893, #894, #897, #905, #906.

No readonly reviewers spawned; no verdict labels applied.

## Sebastian action queue

```txt
Ship candidates: —
Close candidates: —
Hold — needs fix: #916 (superseded by tick 020 PR with audit fix)
Waiting on merge_prep: —
CI-green, review gate BLOCKED: #890, #892, #893, #894, #895, #897, #898, #899, #900, #901, #902, #903, #904, #905, #906, #907, #908, #909, #910, #911, #912, #913, #914, #915 (await Sebastian review / branch protection)
Intake: no_safe_work (mark issues Ready on Project board or add intake label)
Orchestrator meta: this tick (#020) records state on branch cursor/unified-shipping-loop-orchestrator-4487
```

## Follow-ups

1. Intake still blocked until Ready marker visible (`status:ready` label or Project V2 access).
2. Ship_review can score PRs when `mergeStateStatus` flips to CLEAN after Sebastian approval.
3. Close or mark draft superseded orchestrator PRs (#890–#916) once Sebastian merges latest tick 020 state.
4. Non-draft dependabot PRs (#892, #893, #894, #897, #905, #906) remain CI-green — Sebastian merge gate only.
