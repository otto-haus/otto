# 156 — CI audit gate parity

Owner: Codex
Priority: P1
Depends on: none
Release bucket: dev-environment

## Outcome

The local `task ci` gate and GitHub `CI / checks` job run the same gate, including desktop Electron build, `bun audit`, and whitespace diff checks.

## Why this matters

Green CI should mean the same thing as the local hand-run gate. This prevents an audit-red or build-red dependency graph from passing review because the workflow checked a smaller set of commands.

## Scope

- Add a shared local gate script for the full manual gate.
- Make `task ci` call that shared gate.
- Make `.github/workflows/ci.yml` install with the pinned Bun version and call the same shared gate.
- Update the desktop build toolchain so `bun audit` is clean.

## Out of scope

- Merging, tagging, releasing, npm publishing, or changing repository settings.
- Renaming the existing `CI / checks` contract.
- Pinning actions to commit SHAs; that remains a separate hardening pass.

## Done when

- `task ci` runs the full local gate.
- GitHub `CI / checks` still exists and calls the shared gate.
- `bun audit` reports no vulnerabilities.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task ci
actionlint .github/workflows/ci.yml
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-gate-parity`
Branch: `ci/gate-parity`

Changed:

- Added `.bun-version` pinned to Bun `1.3.14`.
- Added `scripts/ci-local-gate.sh` for the full local gate.
- Updated `task ci` to call the shared gate.
- Updated `.github/workflows/ci.yml` to use the pinned Bun version, least-privilege read permissions, concurrency cancellation, a timeout, frozen install lockfile check, and the shared gate.
- Updated the desktop build toolchain to Electron `^42.4.0` with an `esbuild` override so `bun audit` is clean.

Proof:

```sh
bun install --frozen-lockfile
task ci
actionlint .github/workflows/ci.yml
git diff --check
```

Result:

- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, and diff whitespace check.
- `actionlint .github/workflows/ci.yml` passed.
- Generated readiness writeback was restored before commit.

PR proof still required:

- The changed `pull_request` workflow must run green on GitHub before this can be treated as workflow-proven.
