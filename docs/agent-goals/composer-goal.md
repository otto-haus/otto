# Composer goal — implementation lane

Continuously implement the highest-priority Ready otto issues with small correct PRs and real proof.

Use Composer 2.5 Fast where available.

## Source of truth

- Repo: `otto-haus/otto`
- Board: <https://github.com/orgs/otto-haus/projects/1>
- GitHub Issues = work items
- Hot-loop workflow = GitHub Issues/PRs via REST + labels
- Project V2 = dashboard sync only; do not use as hot-loop state
- Priority order: `p0` → `p1` → `p2` → `p3`
- Receipts/proof = completion truth
- Milestones are not workflow truth
- `main` = only long-lived integration branch
- Releases = tags + GitHub Release artifacts from `main`

## Work loop

1. Pick the highest-priority Ready issue.
2. Move it to In progress if board access exists.
3. Create a fresh short-lived branch/worktree from latest `main` unless the issue explicitly targets a temporary cutover branch.
4. Read the issue fully.
5. Make the smallest correct fix satisfying acceptance criteria.
6. Add/update tests when practical.
7. Run credible proof.
8. Open/update a PR linking the issue.
9. Move issue/PR to In review.
10. Stop that issue until native Codex Cloud / Codex / Claude review.
11. If the PR is waiting on review or merge, record the gate and pick the next independent Ready issue.

## Parallelism

Default: one independent ticket = one Composer agent = one branch/worktree. Spawn multiple Composer agents for disjoint Ready issues. Keep each agent scoped to one issue unless the issue explicitly requires a bundle.

Collision rules:

- If another active agent/PR owns the same files, pick another Ready issue or coordinate first.
- Release/install scripts, shared runtime transport, and app shell files are collision-prone; use one implementer plus reviewers.
- Never merge your own PR. Sebastian is the merge/release gate.

## Proof defaults

```bash
bun install
bun run typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

Use narrower checks only when clearly justified. UI work needs screenshots/video. Runtime work needs logs/smoke receipts.

## Boundaries

- Do not merge to protected `main`.
- Do not tag/publish/release.
- Do not mutate `/Applications/otto.app` (release installs from GitHub Release artifact only).
- Default staging proof: `task staging` → `/Applications/otto-staging.app` on latest `main`; do not mutate unless Sebastian explicitly authorizes that exact run.
- Prefer nonintrusive/headless/no-focus desktop smoke tests.
- Do not touch secrets/security config or destructive data without approval.

## PR body

```md
## What changed

## Linked issue
Fixes #123

## Why it matters

## Proof
- [ ] check:
- [ ] test:
- [ ] screenshot/video:
- [ ] smoke log:

## Risk check
- filesystem writes:
- Electron IPC / permissions:
- runtime transport:
- secrets / credentials:
- official app bundles touched? no

## Known limitations

## Reviewer request
Ready for Codex/Claude verification.
```
