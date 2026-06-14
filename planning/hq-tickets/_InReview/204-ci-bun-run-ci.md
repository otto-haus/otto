# 204 — Bun local CI script

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

Contributors can run the full local CI gate with `bun run ci`, using the package manager already required by the repo.

## Why this matters

The repo has `task ci` and `scripts/ci-local-gate.sh`, but no standard `package.json` script for the full gate. A `bun run ci` entrypoint improves contributor ergonomics and gives agents a package-manager-native command that maps directly to the same gate GitHub Actions runs.

## Scope

- Add a root `ci` package script that runs `bash scripts/ci-local-gate.sh`.
- Keep `scripts/ci-local-gate.sh`, `.github/workflows/ci.yml`, status-check names, and task commands unchanged.

## Out of scope

- Changing workflow behavior.
- Renaming `CI` or `checks`.
- Changing repository settings.
- Replacing the shell gate implementation.
- Marking the PR ready for human review.

## Done when

- `package.json` includes `ci`.
- `bun run ci` runs the full local gate.
- The full local gate still passes.
- The PR's own `CI / checks` run passes on GitHub.

## Verification

```sh
bun install --frozen-lockfile
bun run ci
git diff --check
gh pr checks <pr> --watch
```

## Blocker log

## Execution receipt

Date: 2026-06-14
Branch: `ci/bun-ci-script`
Base: `origin/main` at `f8cd78a63368327a5f3fea6b61cdca049af324a9`

### What changed

- Added root package script: `ci`.
- `bun run ci` delegates to `bash scripts/ci-local-gate.sh`.
- Left the gate script, CI workflow, Taskfile, status-check names, repository settings, and release settings unchanged.

### Docs and standards basis

- Standards decision: go. The change is a narrow contributor-tooling entrypoint that points at existing source truth and does not alter release, repository, or branch-protection state.
- Context7 basis: Bun docs confirm `bun run <script>` executes package scripts from `package.json`, and the explicit `bun run` form avoids ambiguity with built-in Bun commands.

### Local proof

```sh
bun install --frozen-lockfile
git diff --check
bun run ci
git status --short --branch
```

Result:

- `bun install --frozen-lockfile` passed with Bun `1.3.14` and reported no changes after adding the script.
- `git diff --check` passed before commit.
- `bun run ci` passed from the committed state.
- Gate coverage included core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 36 unit tests, `verify:v0`, desktop Electron build, `bun audit`, whitespace check, and clean-worktree check.
- `git status --short --branch` showed no generated writeback noise after the gate.

### Remote proof

PR CI `checks` passed:

```txt
https://github.com/otto-haus/otto/actions/runs/27509126094/job/81305828515
```
