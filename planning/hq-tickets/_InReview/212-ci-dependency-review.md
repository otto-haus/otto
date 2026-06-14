# 212-ci-dependency-review

Owner: Codex
Status: In review

## Outcome

Pull requests get a supply-chain dependency diff check before dependency changes
can merge unnoticed.

## What changed

- Added `.github/workflows/dependency-review.yml`.
- Runs GitHub Dependency Review on `pull_request` targeting `main`.
- Uses least-privilege `contents: read`, concurrency cancellation, and a
  10-minute job timeout.
- Pins `actions/checkout` and `actions/dependency-review-action` to full commit
  SHAs with version comments.

## Why

`bun audit` catches the installed tree during CI, but it does not summarize the
dependency diff introduced by a pull request. Dependency Review gives reviewers a
PR-native supply-chain gate and can fail when new vulnerable dependencies are
introduced.

## Execution receipt

- Branch: `ci/dependency-review`
- Worktree: `/tmp/otto-ci-dependency-review`
- Action pins:
  - `actions/checkout` v6.0.0 -> `1af3b93b6815bc44a9784bd300feb67ff0d1eeb3`
  - `actions/dependency-review-action` v5.0.0 -> `a1d282b36b6f3519aa1f3fc636f609c47dddb294`
- Local verification:
  - `bun install --frozen-lockfile` passed.
  - `ruby -e 'require "yaml"; YAML.load_file(ARGV.fetch(0)); puts "yaml ok"' .github/workflows/dependency-review.yml` passed.
  - `actionlint .github/workflows/dependency-review.yml` passed.
  - `task ci` passed.
- PR: pending
- PR CI: pending
