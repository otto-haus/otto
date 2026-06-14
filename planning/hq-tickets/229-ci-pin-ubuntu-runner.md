# 229 - CI pin Ubuntu runner image

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

The `CI / checks` workflow runs on a fixed GitHub-hosted Ubuntu runner label instead of the moving `ubuntu-latest` alias.

## Why this matters

GitHub documents `ubuntu-24.04` as a standard hosted runner label and notes that `-latest` labels can shift. Pinning the runner image reduces surprise CI drift while keeping the same hosted Linux environment class and the same check contract.

## Scope

- Change `.github/workflows/ci.yml` from `ubuntu-latest` to `ubuntu-24.04`.
- Keep the existing `checks` job name.
- Keep the existing workflow permissions, timeout, install step, and local gate command.

## Out of scope

- Changing action versions or pinning actions to SHAs.
- Changing repository rulesets or required checks.
- Changing dependency versions or package manager settings.

## Done when

- `.github/workflows/ci.yml` uses `runs-on: ubuntu-24.04`.
- `actionlint` passes.
- The local CI gate passes.
- The PR's own `CI / checks` run is green on the pinned runner.

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
