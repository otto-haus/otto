# 161 — Pin CI Action SHAs

Owner: Codex
Priority: P1
Depends on: 156, 157
Release bucket: dev environment

## Outcome

The `CI / checks` workflow uses immutable full-length commit SHAs for third-party actions while preserving the existing workflow and check names.

## Why this matters

Pinned action SHAs reduce supply-chain risk from mutable tags. GitHub's Actions hardening guidance recommends full SHA pins for immutable action references.

## Scope

- Pin `actions/checkout` to the full SHA for v4.3.1.
- Pin `oven-sh/setup-bun` to the full SHA for v2.2.0.
- Keep `CI`, `checks`, `permissions: contents: read`, `concurrency`, timeout, and the local gate unchanged.

## Out of scope

- Changing required checks or repo settings.
- Adding release, deploy, tag, or publish behavior.
- Adding write permissions or secrets.

## Done when

- Workflow YAML parses.
- Action SHAs are full length and map to the intended upstream release tags.
- The local gate passes.
- The PR's own `CI / checks` run passes.

## Verification

```sh
git ls-remote --tags https://github.com/actions/checkout.git 'refs/tags/v4*'
git ls-remote --tags https://github.com/oven-sh/setup-bun.git 'refs/tags/v2*'
bun install --frozen-lockfile
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'
task ci
```

## Execution receipt

- Used Context7 for current GitHub Actions guidance: full-length commit SHAs are the immutable action reference form.
- Resolved upstream release tags with `git ls-remote`:
  - `actions/checkout@v4.3.1` -> `34e114876b0b11c390a56381ad16ebd13914f8d5`
  - `oven-sh/setup-bun@v2.2.0` -> `0c5077e51419868618aeaa5fe8019c62421857d6`
- Updated `.github/workflows/ci.yml` without changing workflow name `CI`, job name `checks`, permissions, concurrency, timeout, or local gate command.
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'` passed.
- `actionlint .github/workflows/ci.yml` passed.
- `bun install --frozen-lockfile` passed.
- Pre-commit `task ci` reached the final clean-diff check and failed only because the intended workflow/ticket edits were uncommitted.
- `apps/desktop/src/data/readiness.json` remained clean after Electron build.
- Clean `task ci` passed after commit.

## Blocker log

Leave blank unless blocked.
