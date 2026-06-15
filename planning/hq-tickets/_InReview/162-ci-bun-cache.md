# 162 — Cache Bun Store in CI

Owner: Codex
Priority: P1
Depends on: 156, 157
Release bucket: dev environment

## Outcome

The `CI / checks` job restores and saves Bun's package cache so dependency installation is faster without changing the local gate contract.

## Why this matters

CI currently installs from a cold Bun package store on each run. Caching the Bun store makes repeated PR checks faster while preserving `bun install --frozen-lockfile` and lockfile mutation checks.

## Scope

- Resolve the Bun cache directory at runtime with `bun pm cache dir`.
- Add `actions/cache` pinned to the full SHA for v5.0.5.
- Key the cache by runner OS, `.bun-version`, and `bun.lock`.
- Keep the workflow name `CI`, job name `checks`, permissions, concurrency, timeout, install command, lockfile diff check, and local gate command unchanged.

## Out of scope

- Changing required checks or repo settings.
- Replacing the local gate.
- Adding release, deploy, tag, publish, secret, or write-permission behavior.

## Done when

- Workflow YAML parses and passes `actionlint`.
- The local gate passes.
- The PR's own `CI / checks` run passes using the changed workflow.

## Verification

```sh
git ls-remote --tags https://github.com/actions/cache.git 'refs/tags/v5*'
bun pm cache dir
bun install --frozen-lockfile
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'
actionlint .github/workflows/ci.yml
task ci
```

## Execution receipt

- Used Context7 for current `actions/cache` restore/cache syntax.
- Resolved `actions/cache@v5.0.5` to full SHA `27d5ce7f107fe9357f9df03efb73ab90386fccae` with `git ls-remote`.
- Verified Bun exposes its package cache path via `bun pm cache dir`.
- Added a runtime `Locate Bun cache` step before install so CI caches the runner-specific Bun store path.
- Added `Cache Bun package store` keyed by `${{ runner.os }}-bun-${{ hashFiles('.bun-version', 'bun.lock') }}` with a runner/Bun prefix restore key.
- Preserved workflow name `CI`, job name `checks`, permissions, concurrency, timeout, install command, lockfile diff check, and local gate command.
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'` passed.
- `actionlint .github/workflows/ci.yml` passed.
- `bun install --frozen-lockfile` passed.
- Pre-commit `task ci` reached the final clean-diff check and failed only because the intended workflow/ticket edits were uncommitted.
- `apps/desktop/src/data/readiness.json` remained clean after Electron build.
- Clean `task ci` passed after commit.

## Blocker log

Leave blank unless blocked.
