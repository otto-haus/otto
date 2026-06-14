# 228 - CI main pull request trigger

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

The existing `CI / checks` workflow runs for pull requests targeting `main`, matching the repository's default-branch PR contract.

## Why this matters

otto's merge gate is governed by the workflow on the default branch, and this improvement loop opens PRs against `main`. GitHub Actions supports filtering `pull_request` runs by target branch. Scoping the trigger to `main` keeps required CI focused on merge candidates for the protected branch while preserving push coverage for `main`.

## Scope

- Add `branches: [main]` to the `pull_request` trigger in `.github/workflows/ci.yml`.
- Keep the existing `push` trigger for `main`.
- Keep the existing `checks` job name and gate command.

## Out of scope

- Changing repository rulesets or required checks.
- Renaming workflow jobs.
- Changing action versions, permissions, dependencies, or install commands.

## Done when

- `.github/workflows/ci.yml` filters pull request runs to `main`.
- `actionlint` passes.
- The local CI gate passes.
- The PR's own `CI / checks` run is green.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
actionlint
task ci
git diff --check HEAD~1 HEAD
```

## Blocker log

Leave blank unless blocked.
