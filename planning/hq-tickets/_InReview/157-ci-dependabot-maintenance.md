# 157 — Dependabot maintenance baseline

Owner: Codex
Priority: P1
Depends on: 156-ci-audit-gate
Release bucket: dev-environment

## Outcome

otto has a default Dependabot configuration for dependency upkeep across Bun/npm package manifests and GitHub Actions workflows.

## Why this matters

The audit gate can only stay useful if dependency updates arrive as small, reviewable PRs before security drift piles up. Dependabot should create bounded maintenance PRs instead of leaving humans to discover stale toolchain and workflow versions manually.

## Scope

- Add `.github/dependabot.yml`.
- Enable weekly version checks for the root npm/Bun dependency graph.
- Enable weekly version checks for GitHub Actions workflow references.
- Group npm minor and patch version updates to keep review noise down.
- Limit open Dependabot PRs per ecosystem.
- Record recommended repository billing/workflow settings in this ticket and the PR body.

## Out of scope

- Merging, tagging, releasing, npm publishing, or changing repository settings.
- Enabling or disabling Dependabot security features through repository settings.
- Changing branch protection, required checks, budgets, billing, or runner policies.
- Pinning existing actions to commit SHAs; keep that as a separate hardening pass.

## Recommended GitHub settings

- Actions: enabled.
- Workflow permissions: restricted read-only default, with `contents` and `packages` read.
- `Allow GitHub Actions to create and approve pull requests`: off.
- Runners: standard GitHub-hosted Linux for this repo; avoid larger runners unless explicitly approved.
- Billing: use Actions budget alerts for the owner or organization; do not hard-stop public CI unless cost controls require it.

## Done when

- `.github/dependabot.yml` exists and covers `npm` plus `github-actions`.
- Dependabot PR volume is bounded with open PR limits and grouped npm minor/patch updates.
- The repo-setting recommendations are visible in the PR body.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task ci
ruby -e 'require "yaml"; YAML.load_file(".github/dependabot.yml")'
actionlint .github/workflows/ci.yml
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/Users/seb/Code/otto-pr-47`
Branch: `ci/gate-parity`

Changed:

- Added `.github/dependabot.yml`.
- Configured weekly npm/Bun dependency version checks at `/`.
- Configured weekly GitHub Actions dependency version checks at `/`.
- Grouped npm minor/patch version updates and limited open Dependabot PRs per ecosystem.
- Recorded repository setting recommendations for the PR body without mutating repo settings.

Proof:

```sh
bun install --frozen-lockfile
task ci
ruby -e 'require "yaml"; YAML.load_file(".github/dependabot.yml")'
actionlint .github/workflows/ci.yml
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `ruby -e 'require "yaml"; YAML.load_file(".github/dependabot.yml")'` passed.
- `actionlint .github/workflows/ci.yml` passed.
