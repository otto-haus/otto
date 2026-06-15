# Tick 004 — Task subagents

**At:** 2026-06-15T04:00:00Z  
**spawn_mechanism:** task_subagents  
**spawn_verification_passed:** true  
**global_agents:** 11

## Budget

| Pool | Cap | Spawned | Completed |
|------|-----|---------|-----------|
| BUILD north_star | 8 | 1 | 1 |
| BUILD product | 8 | 1 | 1 |
| BUILD readonly_audit | 10 | 1 | 1 |
| BUILD issue_synthesizer | 4 | 0 | 0 (orchestrator filed) |
| SHIP intake | 10 | 0 | 0 |
| SHIP merge_prep | 12 | 0 | 1 (orchestrator) |
| SHIP ship_review | 8 | 0 | 2 (orchestrator) |
| **Total Task spawns** | **≤8** | **3** | **3** |

## Preconditions

- `program.status`: active
- `defer_mode`: false
- `gates.build.ratified_in_progress`: empty → intake **no_safe_work**

## BUILD

### Issues filed

| Issue | Title |
|-------|-------|
| #635 | Sidebar nav badge counts never populated |
| #636 | Practice mining observe() has no trigger |
| #637 | Behavior changelog not injected into agent context |
| #638 | DreamSettingsPanel hardcoded defaults when disconnected |

### Awaiting ratification (Sebastian only)

#627, #628, #630, #631, #632, #633, #635, #636, #637, #638

### Label debt

#630–#633 missing `p2` + `status: build candidate` labels — gh token lacks `addLabelsToLabelable`; Sebastian should label on ratify.

### Deferred (p3, not filed)

- Onboarding eyebrow `OTTO` → `otto`
- Provider mirror false "Letta reachable" on URL config alone

## SHIP

### intake

`no_safe_work` — still zero `status: in progress` issues.

### merge_prep

| PR | State | Verdict |
|----|-------|---------|
| 618 | **MERGED** | winner (tick 3) |
| 626 | **MERGED** | winner (tick 3) |
| 624 | OPEN, CLEAN, CI green | SHIP_CANDIDATE |
| 582 | OPEN, CLEAN, CI green | SHIP_CANDIDATE (new) |
| 587 | OPEN | CLOSE_CANDIDATE → #624 |
| 588 | OPEN | CLOSE_CANDIDATE → #618 (merged) |
| 596 | OPEN | CLOSE_CANDIDATE → #626 (merged) |

**Sebastian action:** close dupes #587, #588, #596 now that winners merged.

### ship_review

- Receipt: `docs/receipts/pr-ship-review/pr-582.md` (new)
- Receipt: `docs/receipts/pr-ship-review/pr-624.md` (tick 3, still valid)

`gates.ship.ready_for_sebastian`: #624, #582

## Dedupe / defer notes

- Winners #618/#626 merged since tick 3 — dupes should be closed
- gh integration cannot add PR/issue labels or comments — receipts in repo only
