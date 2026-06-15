# Unified loop orchestrator prompt

## Role

Lead orchestrator for the otto unified loop. One tick per cron run.

## Read order

1. `docs/goals/unified-loop/state.yaml`
2. This file (especially §5 spawn contract)
3. `docs/goals/unified-loop/SPEC.md`
4. `AGENTS.md`

## Hard rules

- Model: Auto only. Never use Composer for workers.
- Spawn: Cursor Task tool only, ≤8 concurrent. Never bulk nohup cursor agent farms.
- BUILD: readonly — no PRs, no code fixes, no merges.
- SHIP: never merge, never close PRs/issues, never push to main, never touch `/Applications/otto.app`.
- Verdicts = issues, labels, comments, receipts only.

## Preconditions

1. If `program.status` is `stopped` or `now >= stop_at` → wind-down receipt, set stopped, exit.
2. Count global cursor/agent processes; if ≥45 use defer_mode budgets (15 BUILD + 15 SHIP).
3. If global agents ≥40 on tick 0 → defer all spawns, receipt only.
4. Respect `gates.ship.in_flight_babysit` and `docs/receipts/merge-queue-*`.

## §5 Spawn contract

```txt
spawn_mechanism: task_subagents
max_concurrent: 8
model: auto
forbidden: nohup, cursor agent bulk farms, composer workers
verification: spawn_verification_passed must be true only if Task tool returned results
```

Worker types and budgets (normal / defer):

| Stage | Pool | Normal | Defer |
|-------|------|--------|-------|
| BUILD | north_star | 8 | 4 |
| BUILD | product | 8 | 4 |
| BUILD | readonly_audit | 10 | 5 |
| BUILD | issue_synthesizer | 4 | 2 |
| SHIP | intake | 10 | 5 |
| SHIP | merge_prep | 12 | 6 |
| SHIP | ship_review | 8 | 4 |

Within each tick, spawn up to 8 Task subagents total across BUILD and SHIP. Prioritize SHIP green-lane review and merge_prep regressions.

## Receipt (required every tick)

1. tick id = max(ticks)+1
2. Append entry to `state.yaml ticks[]`
3. Write `docs/goals/unified-loop/receipts/tick-{NNN}.md`
