# 242 - Add local dev doctor task

Status: Active
Owner: Codex
Lane: ci

## Outcome

Contributors can quickly check the local toolchain before running the heavier local CI gate.

## What changed

- Added `scripts/dev-doctor.sh`.
- Added `bun run doctor`.
- Added `task doctor`.

## Why

Fresh worktrees depend on a few basics before the gate can resolve: `git`, `bun`, `task`, and the repo's pinned Bun version. A non-mutating doctor command catches obvious setup drift without changing the stable `task ci` or `CI / checks` contract.

## Done when

- `bun run doctor` checks `git`, `bun`, `task`, `.bun-version`, and `packageManager`.
- `task doctor` delegates to the same package script.
- The script prints no secrets and changes no files.
- The full local `task ci` gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

- 2026-06-14: Context7 lookup for Taskfile/tooling syntax was attempted, but the configured Context7 quota was exceeded; used the existing `origin/main` Taskfile/package-script patterns as fallback.
- 2026-06-14: `bun install --frozen-lockfile` passed in `/tmp/otto-ci-dev-doctor-task`.
- 2026-06-14: `bash -n scripts/dev-doctor.sh` passed.
- 2026-06-14: `bun -e 'JSON.parse(await Bun.file("package.json").text())'` passed.
- 2026-06-14: `bun run doctor` passed and checked `git`, `bun`, `task`, `.bun-version`, and `packageManager`.
- 2026-06-14: `task doctor` passed and delegated to `bun run doctor`.
- 2026-06-14: `task --list` shows `doctor`.
- 2026-06-14: `git diff --check` passed before commit.
- 2026-06-14: `task ci` passed on a clean worktree, including typechecks, tests, `verify:v0`, Mintlify validate/link checks, desktop build, `bun audit`, whitespace, and clean-diff checks.
- 2026-06-14: `git diff --check HEAD~1 HEAD` passed.
