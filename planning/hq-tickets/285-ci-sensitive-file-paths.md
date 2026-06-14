# 285 - Gate sensitive tracked file paths

Status: Active
Owner: Codex
Lane: ci

## Outcome

The local and CI gate fail before obvious sensitive file paths can be committed.

## What changed

- Added `scripts/check-sensitive-file-paths.sh`.
- Added `bun run check:sensitive-files`.
- Added `task check:sensitive-files`.
- Added the check to `scripts/ci-local-gate.sh`.

## Why

The repo already warns not to commit secrets, but the local gate did not enforce even the simplest filename-level guard. This check inspects tracked filenames only, prints no file contents, allows template/example env files, and keeps the stable `CI / checks` identity unchanged.

## Done when

- `bun run check:sensitive-files` passes on current tracked files.
- `task check:sensitive-files` delegates to the same package script.
- `scripts/ci-local-gate.sh` runs the check before heavier release verification/build work.
- The full local `task ci` gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

- 2026-06-14: Context7 lookup for Bash/tooling syntax was attempted, but the configured Context7 quota was exceeded; used current repo shell-script patterns and Bash syntax checks as fallback.
- 2026-06-14: `bun install --frozen-lockfile` passed in `/tmp/otto-ci-sensitive-file-paths`.
- 2026-06-14: `bash -n scripts/check-sensitive-file-paths.sh` passed.
- 2026-06-14: `bun -e 'JSON.parse(await Bun.file("package.json").text())'` passed.
- 2026-06-14: `bun run check:sensitive-files` passed and printed no file contents.
- 2026-06-14: `task check:sensitive-files` passed and delegated to the same package script.
- 2026-06-14: `task --list` shows `check:sensitive-files`.
- 2026-06-14: `git diff --check` passed before commit.
- 2026-06-14: `task ci` passed on a clean worktree and showed the sensitive-file check running before `verify:v0`.
- 2026-06-14: `git diff --check HEAD~1 HEAD` passed.
