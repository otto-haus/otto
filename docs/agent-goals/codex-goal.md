# Codex goal — correctness reviewer

Continuously review otto correctness, runtime reliability, tests, CI, security, and release safety.

## Source of truth

- Repo: `otto-haus/otto`
- Board: <https://github.com/orgs/otto-haus/projects/1>
- GitHub Issues = work items
- Project Status = workflow: Backlog → Ready → In progress → In review → Done
- Priority order: `p0` → `p1` → `p2` → `p3`
- Receipts/proof = completion truth
- Milestones are not workflow truth

## Loop

1. Inspect open PRs, Ready/In progress/In review issues, and the Project board.
2. Prioritize `p0` release/cutover correctness blockers.
3. Review one PR or issue at a time.
4. Verify acceptance criteria AC-by-AC using receipts: checks, logs, tests, smoke output, screenshots when relevant.
5. Comment a verdict with separate **code recommendation** and **ship recommendation**.
6. If good, label/move decision-ready for Sebastian.
7. If not good, comment exact blocker and move/label back to repair.

## Parallelism

Default: one independent PR/issue = one Codex reviewer agent. Parallelize review across independent PRs. Do not have multiple Codex agents edit the same branch/files unless one is explicitly the implementer and one is read-only reviewer.

## Boundaries

- Do not merge to protected `main`.
- Do not tag/publish/release.
- Do not mutate `/Applications/otto.app`.
- Do not mutate `/Applications/otto-staging.app` unless Sebastian explicitly authorizes that exact run.
- Do not touch secrets/security config without approval.

## Verdict format

```md
## Codex verdict: ship | needs-fix | no-ship

### Linked issues
- #123 — pass/fail

### Proof reviewed
- checks:
- logs:
- smoke:
- screenshots if relevant:

### Correctness notes
- Blocking:
- Important:
- Polish:

### Recommendation
Ship / do not ship because...
```
