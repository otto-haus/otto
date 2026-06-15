# 208 — CI ruleset runbook

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

The repo has a committed runbook for the GitHub branch/ruleset settings that should guard `main`, including when to enable code scanning and code quality requirements.

## Why this matters

The repository's CI behavior lives in code, but required checks, force-push protection, code scanning merge protection, and code quality merge protection live in GitHub settings. A runbook lets PRs propose the right settings without agents mutating repository settings directly.

## Scope

- Add `docs/ci-ruleset.md`.
- Document `CI / checks` as the stable required status check.
- Document recommended branch protections.
- Document when to enable code scanning and code quality results.
- Preserve the human-only boundary for repository settings.

## Out of scope

- Changing repository settings.
- Changing workflow files.
- Renaming `CI` or `checks`.
- Adding CodeQL or code quality workflows.
- Marking the PR ready for human review.

## Done when

- The runbook exists in `docs/`.
- The runbook does not claim settings are already enabled.
- The full local gate still passes.
- The PR's own `CI / checks` run passes on GitHub.

## Verification

```sh
bun install --frozen-lockfile
task ci
git diff --check
gh pr checks <pr> --watch
```

## Blocker log

## Execution receipt

Date: 2026-06-14
Branch: `ci/ruleset-runbook`
Base: `origin/main` at `54a1846f1d7f3ce286db8117533c9f8c602a913f`

### What changed

- Added `docs/ci-ruleset.md`.
- Documented `CI / checks` as the required status-check contract for `main`.
- Proposed branch rules: pull requests, required `CI / checks`, optional up-to-date branch requirement, blocked force pushes, and blocked deletions.
- Documented when to enable code scanning and code quality requirements.
- Preserved the human-only repository settings boundary.

### Docs and standards basis

- Standards decision: go. This is a proposal-only runbook that improves settings clarity without mutating GitHub repository settings or claiming settings are already enabled.
- Context7 basis: GitHub docs describe required status checks as branch protection/ruleset rules, force-push blocking as a ruleset protection, and code scanning merge protection as a ruleset requirement that should be used once code scanning results exist. GitHub docs also mention code quality checks as a possible ruleset guardrail, so the runbook keeps it off until a tool is producing PR results and thresholds are chosen.

### Local proof

```sh
bun install --frozen-lockfile
git diff --check
task ci
git status --short --branch
```

Result:

- `bun install --frozen-lockfile` passed with Bun `1.3.14` and reported no changes.
- `git diff --check` passed before commit.
- `task ci` passed from the committed state.
- Gate coverage included core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 36 unit tests, `verify:v0`, Mintlify docs validation, Mintlify broken-link check, desktop Electron build, `bun audit`, whitespace check, and clean-worktree check.
- `git status --short --branch` showed no generated writeback noise after the gate.

### Remote proof

PR CI `checks` passed:

```txt
https://github.com/otto-haus/otto/actions/runs/27509375003/job/81306507086
```
