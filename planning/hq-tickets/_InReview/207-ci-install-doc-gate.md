# 207 — Install doc local gate

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

`docs/INSTALL.md` points developers at reproducible dependency install and the full local CI gate, so install instructions no longer understate what PR authors need to run.

## Why this matters

The install guide still used plain `bun install` and the older three-command verify list. That can leave contributors thinking the local proof path is smaller than the GitHub Actions `CI / checks` gate.

## Scope

- Change development install docs to `bun install --frozen-lockfile`.
- Document `task ci` as the local gate.
- Document `bash scripts/ci-local-gate.sh` as the fallback when Task is unavailable.
- Name the gate coverage at a high level.

## Out of scope

- Changing workflow behavior.
- Renaming `CI` or `checks`.
- Changing repository settings.
- Adding dependencies or package scripts.
- Marking the PR ready for human review.

## Done when

- `docs/INSTALL.md` uses frozen install.
- `docs/INSTALL.md` points to the full local gate.
- The full local gate still passes.
- The PR's own `CI / checks` run passes on GitHub.

## Verification

```sh
bun install --frozen-lockfile
task ci
git diff --check
gh pr checks <pr> --watch
```

## Blocker log

## Execution receipt

Date: 2026-06-14
Branch: `ci/install-doc-gate`
Base: `origin/main` at `f8cd78a63368327a5f3fea6b61cdca049af324a9`

### What changed

- Updated `docs/INSTALL.md` to use `bun install --frozen-lockfile`.
- Replaced the older short verify list with `task ci`.
- Added `bash scripts/ci-local-gate.sh` as the fallback if Task is unavailable.
- Named the gate coverage: typechecks, tests, `verify:v0`, Electron build, `bun audit`, whitespace, and clean worktree.

### Docs and standards basis

- Standards decision: go. The change is a narrow install-doc update that aligns contributor instructions with the existing local/CI proof contract and avoids repo settings, releases, or authority drift.
- Context7 basis: Bun docs confirm `bun install --frozen-lockfile` installs exact versions from `bun.lock`, fails when `package.json` disagrees with the lockfile, and does not update the lockfile. Bun docs also identify `bun audit` as the package vulnerability check used by the local gate.

### Local proof

```sh
bun install --frozen-lockfile
git diff --check
task ci
git status --short --branch
```

Result:

- `bun install --frozen-lockfile` passed with Bun `1.3.14` and reported no changes after the docs update.
- `git diff --check` passed before commit.
- `task ci` passed from the committed state.
- Gate coverage included core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 36 unit tests, `verify:v0`, desktop Electron build, `bun audit`, whitespace check, and clean-worktree check.
- `git status --short --branch` showed no generated writeback noise after the gate.

### Remote proof

Pending PR CI.
