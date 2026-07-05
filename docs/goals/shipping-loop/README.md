# Unified shipping loop

One orchestrator tick per hour (Cursor Automation cron) coordinates three phases for `otto-haus/otto`:

1. **intake** — highest-priority Ready issue with no open-PR file collision → one Worker PR (`Fixes #N`)
2. **merge_prep** — babysit CONFLICTING/DIRTY/red-CI PRs (rebase, fix CI; never merge)
3. **ship_review** — green-lane readonly review → receipt + PR comment + labels (never merge/close)

## Read order

1. `state.yaml` — program status, budgets, phase state, tick history
2. Orchestrator prompt (automation template)
3. `docs/goals/pr-ship-review-loop/README.md` — review comment template
4. `AGENTS.md`

## Hard rules

- Lead orchestrator only responds to `AGENT_LOOP_TICK_shipping-loop` or the hourly cron.
- Subagents must not arm nested `AGENT_LOOP_*` schedules.
- Never merge, close PRs/issues, or push to `main`/PR branches without an explicit Worker charter.
- Verdicts = recommendations, labels, comments, receipts only.

## State

Board truth: `docs/goals/shipping-loop/state.yaml`  
Tick receipts: `docs/goals/shipping-loop/receipts/tick-NNN.md`  
PR ship reviews: `docs/receipts/pr-ship-review/pr-{N}.md`
