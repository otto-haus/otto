# 214-ci-scheduled-drift

Owner: Codex
Status: In review

## Outcome

`main` gets a scheduled full-gate drift check so advisory, docs-link, and hosted
tool changes can surface even when no pull request is open.

## What changed

- Added `.github/workflows/scheduled-ci.yml`.
- Runs weekly on Monday at 10:17 UTC.
- Runs on pull requests only when scheduled-gate inputs change, so this PR can
  prove the workflow without adding duplicate full-gate work to every PR.
- Uses least-privilege `contents: read`, concurrency cancellation, a 20-minute
  job timeout, frozen Bun install, lockfile mutation guard, and
  `bash scripts/ci-local-gate.sh`.
- Pins `actions/checkout` and `oven-sh/setup-bun` to full commit SHAs with
  version comments.

## Why

The existing `CI / checks` job protects pull requests and pushes to `main`.
Scheduled CI catches drift outside code changes, especially `bun audit`
advisory changes, Mintlify validation/link drift, and hosted tool behavior
changes.

## Execution receipt

- Branch: `ci/scheduled-drift`
- Worktree: `/tmp/otto-ci-scheduled-drift`
- Action pins:
  - `actions/checkout` v6.0.0 -> `1af3b93b6815bc44a9784bd300feb67ff0d1eeb3`
  - `oven-sh/setup-bun` v2.0.2 -> `735343b667d3e6f658f44d0eca948eb6282f2b76`
- Local verification:
  - `bun install --frozen-lockfile` passed.
  - `ruby -e 'require "yaml"; YAML.load_file(ARGV.fetch(0)); puts "yaml ok"' .github/workflows/scheduled-ci.yml` passed.
  - `actionlint .github/workflows/scheduled-ci.yml` passed.
  - `task ci` passed.
- PR: pending
- PR CI: pending
