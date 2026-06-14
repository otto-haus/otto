# 219-ci-scorecard-readonly

Owner: Codex
Status: In review

## Outcome

otto gets an additive OpenSSF Scorecard supply-chain posture check without
publishing results or widening repository write permissions.

## What changed

- Added `.github/workflows/scorecard.yml`.
- Runs on a weekly schedule, manual dispatch, and pull requests that change the
  Scorecard workflow itself.
- Uses `permissions: contents: read`, concurrency cancellation, a 15-minute job
  timeout, and `persist-credentials: false`.
- Pins `actions/checkout` and `ossf/scorecard-action` to full commit SHAs with
  version comments.
- Sets `publish_results: false` and writes JSON only, so this does not require
  `id-token: write` or `security-events: write`.

## Why

Scorecard audits supply-chain posture such as CI tests, token permissions,
maintainer signals, branch/ruleset posture, dependency-update posture, and
security policy posture. Keeping it read-only gives maintainers a recurring
signal without changing required checks or repository settings.

## Execution receipt

- Branch: `ci/scorecard-readonly`
- Worktree: `/tmp/otto-ci-scorecard-readonly`
- Action pins:
  - `actions/checkout` v6.0.0 -> `1af3b93b6815bc44a9784bd300feb67ff0d1eeb3`
  - `ossf/scorecard-action` v2.4.3 -> `4eaacf0543bb3f2c246792bd56e8cdeffafb205a`
- Local verification:
  - `bun install --frozen-lockfile` passed.
  - `actionlint .github/workflows/scorecard.yml` passed.
  - `ruby -e 'require "yaml"; YAML.load_file(ARGV.fetch(0)); puts "yaml ok"' .github/workflows/scorecard.yml` passed.
  - `task ci` passed.
- PR: pending
- PR CI: pending
