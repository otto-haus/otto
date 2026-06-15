# Tick 003 — Task subagents (spawn contract compliant)

**At:** 2026-06-15T03:38:25Z  
**spawn_mechanism:** task_subagents  
**spawn_verification_passed:** true  
**global_agents:** 8 (below defer threshold 45)

## Budget

| Pool | Cap | Spawned | Completed |
|------|-----|---------|-----------|
| BUILD north_star | 8 | 1 | 1 |
| BUILD product | 8 | 1 | 1 |
| BUILD readonly_audit | 10 | 1 | 1 |
| BUILD issue_synthesizer | 4 | 0 | 0 (orchestrator filed) |
| SHIP intake | 10 | 0 | 0 |
| SHIP merge_prep | 12 | 1 | 0 (readonly blocked gh; orchestrator triaged) |
| SHIP ship_review | 8 | 0 | 3 (orchestrator) |
| **Total Task spawns** | **≤8** | **4** | **3** |

## Preconditions

- `program.status`: active
- `defer_mode`: false (8 global cursor/agent processes)
- `gates.build.ratified_in_progress`: empty → intake **no_safe_work**

## BUILD

### Issues filed (new build candidates)

| Issue | Title |
|-------|-------|
| #630 | PreviewChat setup banner misleads web-preview users |
| #631 | Receipts surface: Correct This bridge for blocked receipts |
| #632 | ConnectLetta connectionMode default mismatch |
| #633 | v1 conduct: remove API key field from Settings |

### Awaiting ratification (Sebastian only)

#627, #628, #630, #631, #632, #633

### Skipped dupes

- Cloud/Labs gate findings → #627, #628
- p3 north_star/product findings deferred (changelog window, model picker fallbacks, canon-briefs casing, surfaceGate dead code)

## SHIP

### intake

`no_safe_work` — zero issues with `status: in progress`.

### merge_prep

| PR | Status | Verdict |
|----|--------|---------|
| 582 | CLEAN, MERGEABLE, CI green | GREEN (was babysit; now stable) |
| 587 | CLEAN, MERGEABLE, CI green | CLOSE_CANDIDATE (superseded by #624) |
| 588 | CLEAN, MERGEABLE, CI green | CLOSE_CANDIDATE (superseded by #618) |
| 596 | CLEAN, MERGEABLE, CI green | CLOSE_CANDIDATE (superseded by #626) |
| 618 | ready for review | SHIP_CANDIDATE |
| 624 | ready for review (labeled this tick) | SHIP_CANDIDATE |
| 626 | ready for review | SHIP_CANDIDATE |

CLOSE_CANDIDATE comments on #587, #588, #596 already present (prior pass).

### ship_review

Receipts written:

- `docs/receipts/pr-ship-review/pr-618.md`
- `docs/receipts/pr-ship-review/pr-624.md`
- `docs/receipts/pr-ship-review/pr-626.md`

`gates.ship.ready_for_sebastian`: #618, #624, #626

## Dedupe / defer notes

- First tick using Task tool ≤8; ticks 1–2 nohup failure not repeated
- merge_prep subagent failed (readonly blocked `gh`); orchestrator ran triage directly
- Issue synthesizer pool deferred p3 batch to avoid queue flood
