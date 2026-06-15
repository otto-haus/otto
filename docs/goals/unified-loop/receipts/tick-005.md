# Tick 005 — Task subagents (post-ratification)

**At:** 2026-06-15T04:35:00Z  
**spawn_mechanism:** task_subagents  
**spawn_verification_passed:** true  
**global_agents:** 4  
**defer_mode:** false

## Budget

| Pool | Cap | Spawned | Completed |
|------|-----|---------|-----------|
| BUILD north_star | 8 | 1 | 1 |
| BUILD product | 8 | 1 | 1 |
| BUILD readonly_audit | 10 | 1 | 1 |
| BUILD issue_synthesizer | 4 | 0 | 0 (orchestrator filed) |
| SHIP intake | 10 | 1 | 1 (scout) |
| SHIP merge_prep | 12 | 1 | 1 |
| SHIP ship_review | 8 | 1 | 1 |
| **Total Task spawns** | **≤8** | **6** | **6** |

## Preconditions

- `program.status`: active
- `global_agents`: 4 (< 40, < 45) → normal budgets
- `gates.build.ratified_in_progress`: 10 issues — **intake unlocked**
- `gates.ship.in_flight_babysit`: empty

## BUILD

### Issues filed (orchestrator, deduped)

| Issue | Title | p-label |
|-------|-------|---------|
| #650 | Providers mirror shows Letta reachable from stale config URL | p2 |
| #658 | receipt_failure proposals never auto-created from blocked receipts | p2 |
| #656 | Model picker hardcoded GPT-5.5 fallback on empty list | p3 |
| #657 | LiveChat aria-label uses Otto instead of otto | p3 |

### Awaiting ratification (Sebastian only)

#650, #656, #657, #658 (new). Prior ratified queue unchanged: #627–#638.

### Dedupe skipped

- API key form → #633
- gen-readiness connected flag → #645
- DreamSettings defaults → #638
- ConnectLetta mode default → #632
- Sidebar badges → #635
- PreviewChat banner → #630

### Label debt

`status: build candidate` label still missing in repo — gh token cannot add labels. Sebastian applies on ratify.

## SHIP

### intake

**Scout recommendation:** #627 (p2, Labs gate on cloud connection mode in Settings).

- Branch: `cursor/627-cloud-connection-labs-gate`
- Files: `Panes.tsx`, `surface-tiers.ts`, `labs-config.ts`
- **Collision gate:** #617/#597/#595 touch `Panes.tsx` — intake worker must rebase after those land or pick disjoint alternative (#630 Chat.tsx, #635 App.tsx, #636 practice-mining.ts)
- No PR created this tick (orchestrator BUILD/SHIP readonly verdicts only)

### merge_prep

| PR | State | Verdict |
|----|-------|---------|
| 624 | OPEN CLEAN CI green | SHIP_CANDIDATE — Sebastian approved merge |
| 582 | OPEN CLEAN CI green | SHIP_CANDIDATE — Sebastian approved merge |
| 625 | OPEN CLEAN CI green | SHIP_CANDIDATE (new) — merge after #624 |
| 587 | OPEN | CLOSE_CANDIDATE → #624 |
| 588 | OPEN | CLOSE_CANDIDATE → #618 (merged) |
| 596 | OPEN | CLOSE_CANDIDATE → #626 (merged) |
| 647 | UNSTABLE CI red | HOLD |
| 542,523,521,518,516,504-506 | DIRTY/CONFLICTING | HOLD — rebase needed |

**Sebastian actions:** merge #624 + #582; close dupes #587/#588/#596; then rebase/merge #625.

### ship_review

- Receipt: `docs/receipts/pr-ship-review/pr-625.md` (new SHIP_CANDIDATE)
- Prior receipts still valid: pr-582.md, pr-624.md

`gates.ship.ready_for_sebastian`: #582, #624, #625

### gh integration

PR comments blocked (`Resource not accessible by integration`). Verdicts recorded in repo receipts only.

## Dedupe / defer notes

- 6 Task subagents spawned via Cursor Task tool; all returned results (spawn contract satisfied)
- Winners #618/#626 merged; dupes #588/#596 should be closed by Sebastian
- #625 shares files with #624 — explicit merge sequencing required
