# Tick 005 — Task subagents

**At:** 2026-06-15T04:05:00Z  
**spawn_mechanism:** task_subagents  
**spawn_verification_passed:** true  
**global_agents:** 5

## Budget

| Pool | Cap | Spawned | Completed |
|------|-----|---------|-----------|
| BUILD north_star | 8 | 1 | 1 |
| BUILD product | 8 | 1 | 1 |
| BUILD readonly_audit | 10 | 2 | 2 |
| BUILD issue_synthesizer | 4 | 0 | 0 (orchestrator filed) |
| SHIP intake | 10 | 0 | 0 |
| SHIP merge_prep | 12 | 1 | 1 |
| SHIP ship_review | 8 | 1 | 1 |
| **Total Task spawns** | **≤8** | **6** | **6** |

## Preconditions

- `program.status`: active
- `defer_mode`: false (global agents 5 < 45)
- `gates.build.ratified_in_progress`: empty → intake **no_safe_work**
- No merge-queue blockers

## BUILD

### Issues filed (tick 005)

| Issue | Title | Priority |
|-------|-------|----------|
| #639 | Memory writeback ratification never applies to Letta | p1 |
| #640 | Routine manual run records success without executing YAML steps | p1 |
| #641 | Practices/Routines/Checks blocked by WORKSPACE_PREVIEW gate | p1 |
| #642 | Command Station ops cards never receive live IPC counts | p2 |
| #643 | Thread switch preserves session-scoped tool permissions | p2 |
| #644 | SDK transport ignores stored Letta conversationId on thread switch | p2 |
| #645 | Readiness marks runtime connected from config flag | p2 |

### Awaiting ratification (Sebastian only)

#627, #628, #630–#645 (17 total)

### Label debt

#630–#633, #639–#645 missing `status: build candidate` — gh token lacks `addLabelsToLabelable`; Sebastian should label on ratify.

### Deferred (not filed)

- Chat model picker hardcoded GPT-5.5 fallbacks (p2, tick-004 overlap)
- Knowledge Labs stat strip shows 0 during load (minor)

## SHIP

### intake

`no_safe_work` — zero `status: in progress` issues.

### merge_prep

| PR | State | Verdict |
|----|-------|---------|
| 582 | OPEN, CLEAN, CI green | SHIP_CANDIDATE (prior tick, receipt written) |
| 624 | OPEN, CLEAN, CI green | SHIP_CANDIDATE |
| 625 | OPEN, CLEAN, CI green | SHIP_CANDIDATE (new) |
| 623 | OPEN, CLEAN, CI green | SHIP_CANDIDATE (new) |
| 622 | OPEN, CLEAN, CI green | SHIP_CANDIDATE (new) |
| 587 | OPEN, CLEAN | CLOSE_CANDIDATE → #624 |
| 588 | OPEN, CLEAN | CLOSE_CANDIDATE → #618 (merged) |
| 596 | OPEN, CLEAN | CLOSE_CANDIDATE → #626 (merged) |
| 542, 523, 521 | DIRTY | HOLD (outside top-15 green batch) |

**Sebastian action:** merge #582, #624, #625, #623, #622; close dupes #587, #588, #596.

### ship_review

New receipts:
- `docs/receipts/pr-ship-review/pr-582.md`
- `docs/receipts/pr-ship-review/pr-624.md`
- `docs/receipts/pr-ship-review/pr-625.md`
- `docs/receipts/pr-ship-review/pr-623.md`
- `docs/receipts/pr-ship-review/pr-622.md`

`gates.ship.ready_for_sebastian`: #582, #624, #625, #623, #622

## Dedupe / defer notes

- 6 Task subagents spawned (within ≤8 cap); all returned results
- Skipped filing model-picker fallback (p2) — overlaps tick-004 deferred item
- gh integration cannot add labels/comments on PRs — receipts in repo only
- #582 rebase not needed (CLEAN, not DIRTY)
