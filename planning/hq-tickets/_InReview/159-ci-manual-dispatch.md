# 159 — Manual CI dispatch trigger

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

Maintainers can run the same CI gate manually from GitHub Actions without pushing a new commit or changing the existing pull request and main-branch triggers.

## Why this matters

Manual reruns are useful when validating CI environment repairs, transient runner failures, or dependency-maintenance branches. This keeps the existing `CI / checks` contract intact while giving reviewers a low-friction way to rerun the authoritative gate.

## Scope

- Add `workflow_dispatch:` to `.github/workflows/ci.yml`.
- Keep the existing `pull_request` and `push` triggers unchanged.
- Keep the existing `checks` job name, permissions, concurrency, timeout, and gate commands unchanged.

## Out of scope

- Merging, tagging, releasing, npm publishing, or changing repository settings.
- Adding workflow inputs, deployment behavior, new jobs, or new secrets.
- Changing branch protection, required checks, runner policy, or billing settings.
- Renaming the `CI / checks` contract.

## Done when

- `.github/workflows/ci.yml` supports manual dispatch.
- The existing automatic triggers and `checks` job remain unchanged.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/ci.yml
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-manual-dispatch`
Branch: `ci/manual-dispatch`

Docs basis:

- Context7 `/websites/github_en_actions`: `workflow_dispatch:` can be listed alongside `pull_request` and `push` in the workflow `on:` block; inputs are optional.

Changed:

- Added `workflow_dispatch:` to `.github/workflows/ci.yml`.
- Left `pull_request`, `push`, permissions, concurrency, timeout, and the `checks` job unchanged.

Proof:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/ci.yml
task ci
git diff --check
```

Result:

- `actionlint .github/workflows/ci.yml` passed.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
