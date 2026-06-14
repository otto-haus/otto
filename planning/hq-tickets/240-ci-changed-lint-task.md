# 240 - Add changed-files lint task

Status: Active
Owner: Codex
Lane: ci

## Outcome

Contributors have a code-quality check for files they changed without requiring the historical Biome lint baseline to be clean first.

## What changed

- Added `scripts/lint-changed.sh`.
- Added `bun run lint:changed`.
- Added `task lint:changed`.

## Why

The repo already has `task lint`, but current `origin/main` has pre-existing Biome diagnostics outside this cycle. A changed-files lint shortcut gives contributors a passing local quality check for new code while preserving the existing full local `task ci` contract.

## Done when

- `bun run lint:changed` exits cleanly when no app/package files changed.
- `task lint:changed` delegates to the same package script.
- The wrapper uses the pinned Biome version already used by `task lint`.
- The full local `task ci` gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

- 2026-06-14: Context7 lookups for Taskfile/Biome syntax were attempted, but the configured Context7 quota was exceeded; used official Biome CLI docs and existing `origin/main` Taskfile patterns as fallback.
- 2026-06-14: `bun install --frozen-lockfile` passed in `/tmp/otto-ci-changed-lint-task`.
- 2026-06-14: Verified broad `bunx --bun @biomejs/biome@1.9.4 lint apps/desktop/src apps/desktop/electron packages` currently fails on pre-existing diagnostics, so this task is intentionally changed-files only.
- 2026-06-14: `bash -n scripts/lint-changed.sh` passed.
- 2026-06-14: `bun -e 'JSON.parse(await Bun.file("package.json").text())'` passed.
- 2026-06-14: `bun run lint:changed` passed with no changed app/package files.
- 2026-06-14: `task lint:changed` passed and delegated to `bun run lint:changed`.
- 2026-06-14: `task --list` shows `lint:changed`.
- 2026-06-14: `git diff --check` passed before commit.
- 2026-06-14: `task ci` passed on a clean worktree, including typechecks, tests, `verify:v0`, Mintlify validate/link checks, desktop build, `bun audit`, whitespace, and clean-diff checks.
- 2026-06-14: `git diff --check HEAD~1 HEAD` passed.
