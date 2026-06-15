# T001 — Worker handoff: Fixes #345 per-ticket merge/review gates

**Issue:** [#345](https://github.com/otto-haus/otto/issues/345)

## Awaiting review / merge (per-ticket — lane continues)

- PR: _(fill on open)_
- Issue: #345
- Files: `docs/agent-goals/**`, `docs/agent-prompts/**`, `docs/goals/github-ready-loop/**`, `scripts/verify-agent-loop-contract.mjs`, `AGENTS.md`, `package.json`

## Active next work

- PM **T002**: after PR is In review, scout next disjoint Ready issue and advance `active_task`.
- Scout **T003**: queued — highest-priority Ready issue with no open-PR file collision.

## No safe work

_not applicable — PM/Scout cycle continues after this PR opens._

## Verify

```bash
bun run verify:agent-loop
bun run verify:v0
```
