# 289-ci-shell-syntax-gate

## Outcome

Add a fast local CI gate that syntax-checks tracked shell scripts before the heavier build and verification steps run.

## What changed

- Added `scripts/check-shell-syntax.sh`, which runs `bash -n` over tracked `*.sh` files.
- Added `bun run check:shell` and `task check:shell` contributor entrypoints.
- Wired `bun run check:shell` into `scripts/ci-local-gate.sh` so `task ci` exercises it.

## Why

The repo has several tracked shell scripts that are part of contributor, release, docs, desktop, and infrastructure workflows. A syntax-only gate is cheap, deterministic, and catches broken shell edits before slower typecheck, test, docs, and Electron build steps.

## Scope

No workflow, branch protection, release, publish, or repository setting changes.

## Documentation lookup

- Context7 GitHub/tooling lookup attempted on 2026-06-14.
- Result: quota blocked (`Monthly quota exceeded`). This patch uses local Bash semantics and repo-local command patterns; no GitHub Actions syntax was changed.

## Verification

- `bash -n scripts/check-shell-syntax.sh` passed.
- `bun -e 'JSON.parse(await Bun.file("package.json").text()); console.log("package.json ok")'` passed.
- `bun run check:shell` passed and checked 20 tracked shell scripts.
- `task check:shell` passed and checked 20 tracked shell scripts.
- `git diff --check` passed.
- `task ci` passed after commit. The gate covered root typecheck, desktop typecheck, Electron typecheck, shell syntax check, `bun test` (`258 pass`, `1 skip`, `0 fail`), `bun run verify:v0`, Mintlify docs validation, Mintlify broken-link check, Electron build, `bun audit` (`No vulnerabilities found`), `git diff --check`, and `git diff --exit-code`.
