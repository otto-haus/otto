# 239 - Add DevEx docs check shortcut

Status: Active
Owner: Codex
Lane: ci

## Outcome

Contributors can run the full DevEx docs gate with one command instead of remembering the separate Mintlify validate and broken-link checks.

## What changed

- Added `bun run docs:check`, which runs `docs:validate` and `docs:links`.
- Added `task docs:check`, which delegates to the package script.

## Why

`task ci` already includes Mintlify validation and broken-link checks, but the docs-specific gate is split across two commands. A single shortcut keeps the local docs proof easier to run without changing the CI check identity or the full local gate.

## Done when

- `bun run docs:check` runs Mintlify validation and link checking.
- `task docs:check` delegates to the same package script.
- The full local `task ci` gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

- 2026-06-14: Context7 lookup for tooling syntax was attempted, but the configured Context7 quota was exceeded; followed the existing Taskfile/package-script patterns in `origin/main`.
- 2026-06-14: `bun install --frozen-lockfile` passed in `/tmp/otto-ci-docs-check-task`.
- 2026-06-14: `bun -e 'JSON.parse(await Bun.file("package.json").text())'` passed.
- 2026-06-14: `bun run docs:check` passed and ran Mintlify validation plus broken-link checking.
- 2026-06-14: `task docs:check` passed and delegated to `bun run docs:check`.
- 2026-06-14: `task --list` shows `docs:check`.
- 2026-06-14: `git diff --check` passed before commit.
- 2026-06-14: `task ci` passed on a clean worktree, including typechecks, tests, `verify:v0`, Mintlify validate/link checks, desktop build, `bun audit`, whitespace, and clean-diff checks.
- 2026-06-14: `git diff --check HEAD~1 HEAD` passed.
