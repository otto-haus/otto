# 215-ci-mise-tool-versions

Owner: Codex
Status: In review

## Outcome

Contributors and agents can install the same CLI tool versions used by the local
gate without reading scattered docs or relying on whatever Homebrew has latest.

## What changed

- Added `mise.toml`.
- Pinned:
  - `bun = "1.3.14"` to match `.bun-version` and CI setup.
  - `task = "3.50.0"` for the `task ci` local gate wrapper.
  - `actionlint = "1.7.12"` for workflow linting.

## Why

`main` already pins Bun through `.bun-version`, but contributors still need
go-task and actionlint for the repo's local CI/developer workflow. A checked-in
mise manifest gives agents and humans a single optional install path for those
tools while preserving the existing `CI / checks` contract.

## Execution receipt

- Branch: `ci/mise-tool-versions`
- Worktree: `/tmp/otto-ci-mise-tool-versions`
- Local verification:
  - `bun install --frozen-lockfile` passed.
  - `python3 -c 'import pathlib, tomllib; data=tomllib.loads(pathlib.Path("mise.toml").read_text()); print(data)'` passed.
  - `CI=1 mise config ls --no-header` reported `bun, task, actionlint` from `mise.toml`.
- PR: pending
- PR CI: pending
