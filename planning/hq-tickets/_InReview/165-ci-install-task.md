# 165 — Frozen install task

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

Contributors and agents have a discoverable `task install` command that installs dependencies with the same frozen lockfile behavior expected by CI.

## Why this matters

The required setup path for fresh worktrees is `bun install --frozen-lockfile`, but the Taskfile did not expose that as a first-class task. A named task reduces accidental lockfile churn and makes local setup match CI's reproducible install behavior.

## Scope

- Add `task install`.
- Add `deps` and `bootstrap` aliases.
- Run `bun install --frozen-lockfile` without changing any CI workflow or dependency versions.

## Out of scope

- Changing `bun.lock`, package manifests, or Bun version.
- Changing the `CI / checks` workflow contract.
- Adding dependencies or repository settings.

## Done when

- `task --list` shows the install task.
- `task install` completes without lockfile mutation.
- The full local gate still passes.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task --list
task install
git diff --exit-code -- bun.lock
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-install-task`
Branch: `ci/install-task`

Docs basis:

- Context7 `/oven-sh/bun`: `bun install --frozen-lockfile` installs exact versions from `bun.lock`, fails when `package.json` disagrees, and does not update the lockfile.
- Context7 `/go-task/task`: Taskfile tasks support `desc`, `aliases`, and `cmds` command lists.

Changed:

- Added `task install` with `deps` and `bootstrap` aliases.

Proof:

```sh
bun install --frozen-lockfile
task --list
task install
git diff --exit-code -- bun.lock
task ci
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `task --list` showed `install` with aliases `deps` and `bootstrap`.
- `task install` passed and reported no changes.
- `git diff --exit-code -- bun.lock` passed.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
