# Agent goals

Keep agent launches tiny and file-native:

```txt
/goal Read docs/agent-goals/codex-goal.md and follow it.
/goal Read docs/agent-goals/claude-goal.md and follow it.
/goalbuddy Read docs/agent-goals/composer-goal.md and prepare the board.
```

The file is the contract. Chat prompts should only point at the file plus any one-off first target.

## Current operating model

The bottleneck is PR → shipped, not ticket → PR.

Use one integration train (`ship/functional-labs` or `integration/cutover`) as the pile:

1. Recommend recent/relevant PRs for the train, not `main`; merge only with Sebastian's exact approval for that train-branch merge.
2. Close stale/conflicting PRs aggressively as “superseded by cutover train”.
3. Stabilize the one train with CI, staging, smoke tests, and dogfood.
4. Open one final train → `main` PR for Sebastian.
5. Release from that after Sebastian approval.

Native Codex Cloud exhaustive review runs on every push and is the default deep review signal. Local Codex should focus on traffic control, AC/proof mapping, labels, stale PR triage, and release-train health.

## Throughput rule

Default to parallel execution: one independent ticket = one agent = one branch/worktree.

Safe to parallelize:

- different issues with disjoint files
- auditor/reviewer work across different PRs
- tests/docs/UX investigations that do not write the same files

Do not parallelize without coordination:

- two agents editing the same file family
- release/install scripts
- migrations/destructive data changes
- `/Applications/otto.app` mutation
- `/Applications/otto-staging.app` mutation unless Sebastian explicitly authorizes that exact run

Sebastian is the merge/release/one-way-door gate. Agents maximize high-quality reviewed PR throughput.

## GitHub workflow state

Use REST Issues/PRs + labels for hot-loop state. Treat Project V2 as dashboard sync, not the live conveyor. Cache item IDs and batch Project updates; do not make every agent repeatedly call Project GraphQL.
