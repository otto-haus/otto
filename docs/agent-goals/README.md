# Agent goals

Shared operating contract for Codex, Claude, Composer/Cursor, and GoalBuddy loops on `otto-haus/otto`.

Lane-specific launch contracts live in this directory. GoalBuddy board truth lives in `docs/goals/*/state.yaml`. Supplemental implementer packets live in `docs/agent-prompts/`.

Keep slash-command launches tiny; the markdown file is the contract:

```txt
/goal Read docs/agent-goals/codex-goal.md and follow it.
/goal Read docs/agent-goals/claude-goal.md and follow it.
/goalbuddy Read docs/agent-goals/composer-goal.md and prepare the board.
```

Chat prompts should only point at the file plus any one-off first target.

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

## Current operating model

The steady-state model is trunk-based development:

- `main` is the only long-lived integration branch.
- Feature/fix PR branches are short-lived merge vehicles.
- Releases are tags + GitHub Release artifacts from `main`, not release branches.
- `otto-staging.app` should track latest `main` or an explicit release-candidate commit with a visible build/source marker.

The bottleneck is PR → shipped, not ticket → PR. Optimize for short-lived PRs merging quickly to `main`, then release from tags/artifacts.

Temporary integration/cutover branches are allowed only to unwind the current PR backlog, not as the steady-state model.

Native Codex Cloud exhaustive review runs on every push and is the default deep review signal. Local Codex should focus on traffic control, AC/proof mapping, labels, stale PR triage, and trunk/release readiness.

## Throughput rule

Default to parallel execution: one independent ticket = one agent = one branch/worktree.

Safe to parallelize:

- different issues with disjoint files
- auditor/reviewer work across different PRs
- tests/docs/UX investigations that do not write the same files

Do not parallelize without coordination:

- two agents editing the same file family
- release/install scripts
- runtime transport and app shell work
- migrations/destructive data changes
- `/Applications/otto.app` mutation
- `/Applications/otto-staging.app` mutation unless Sebastian explicitly authorizes that exact run

Sebastian is the merge/release/one-way-door gate. Agents maximize high-quality reviewed PR throughput.

## GitHub workflow state

Use REST Issues/PRs + labels for hot-loop state. Treat Project V2 as dashboard sync, not the live conveyor. Cache item IDs and batch Project updates; do not make every agent repeatedly call Project GraphQL.
