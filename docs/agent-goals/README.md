# Agent goals

Keep agent launches tiny and file-native:

```txt
/goal Read docs/agent-goals/codex-goal.md and follow it.
/goal Read docs/agent-goals/claude-goal.md and follow it.
/goalbuddy Read docs/agent-goals/composer-goal.md and prepare the board.
```

The file is the contract. Chat prompts should only point at the file plus any one-off first target.

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
- `/Applications/otto.app` or `/Applications/otto-staging.app` mutation

Sebastian is the merge/release/one-way-door gate. Agents maximize high-quality reviewed PR throughput.
