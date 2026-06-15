# Agent goals

Shared operating contract for GoalBuddy / Composer / auditor loops on `otto-haus/otto`.

Lane-specific prompts live in `docs/agent-prompts/`. GoalBuddy board truth lives in `docs/goals/*/state.yaml`.

## Per-ticket gates (non-negotiable)

Merge and review gates are **per ticket / per PR**, not global lane blockers.

- A PR awaiting reviewer `+1` or Sebastian merge pauses **only that issue**.
- The PM loop must immediately scout the next **file-disjoint** Ready issue.
- `active_task: null` is wrong while independent Ready work exists — record why no safe work remains.
- Never idle the whole lane because one PR is stuck at review or merge.

Hot-loop reads: GitHub Issues/PRs via REST + labels (`p0`…`p3`, `status:*`). Batch Project V2 sync; do not poll GraphQL per item.

## PM loop after handoff

When a Worker opens a PR and moves an issue to **In review**:

1. Record the gate on the board (receipt + linked PR).
2. List awaiting PRs in the handoff summary (separate from next work).
3. Scout highest-priority Ready issue that does not collide with open PR file paths.
4. If every Ready issue collides, record `no_safe_work` with the collision map — only then may `active_task` stay unset.
5. Queue Scout → Worker for the next disjoint issue; keep `one_active_task: true`.

## Handoff summary shape

Every Worker/PM handoff must separate awaiting gates from active next work:

```md
## Awaiting review / merge (per-ticket — lane continues)
- PR #N · Fixes #X · status · files touched

## Active next work
- Scout/Worker target: #Y · branch/worktree · why disjoint

## No safe work (only if true)
- Ready issues and file collisions, or explicit blocker
```

## Launch pointers

```txt
/goal Read docs/agent-prompts/composer-implementer.md and follow it.
/goalbuddy Read docs/goals/github-ready-loop/goal.md and prepare the board.
```
