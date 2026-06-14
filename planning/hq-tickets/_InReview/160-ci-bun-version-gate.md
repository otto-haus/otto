# 160 — Local gate Bun version check

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

The local CI gate fails early when the installed Bun version does not match the repo's `.bun-version` pin.

## Why this matters

GitHub Actions installs Bun from `.bun-version`, but local `task ci` previously accepted whatever Bun binary happened to be first on `PATH`. A cheap preflight keeps local proof and CI proof on the same toolchain version before typecheck, tests, build, and audit run.

## Scope

- Add a Bun version preflight to `scripts/ci-local-gate.sh`.
- Compare `bun --version` with `.bun-version`.
- Keep the existing gate order after the preflight unchanged.

## Out of scope

- Changing the pinned Bun version.
- Changing dependencies or regenerating `bun.lock`.
- Changing GitHub Actions setup or required checks.
- Installing Bun or managing developer shells.

## Done when

- `task ci` fails before expensive checks if Bun is not the version pinned in `.bun-version`.
- The normal gate still passes when the installed Bun version matches the pin.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
bash -n scripts/ci-local-gate.sh
bun --version
# temporary fake bun harness returned: mismatch guard passed
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-bun-version`
Branch: `ci/bun-version-gate`

Docs basis:

- Context7 `/oven-sh/bun`: Bun documents `bun --version` as the installed version check.

Changed:

- Added a `.bun-version` comparison preflight to `scripts/ci-local-gate.sh`.
- Left all existing typecheck, test, build, audit, whitespace, and clean-diff checks unchanged.

Proof:

```sh
bun install --frozen-lockfile
bun --version
task ci
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `bash -n scripts/ci-local-gate.sh` passed.
- `bun --version` returned `1.3.14`, matching `.bun-version`.
- A temporary fake `bun --version` returning `0.0.0` triggered the mismatch guard and exited before running the expensive gate.
- `task ci` passed: Bun version preflight, core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
