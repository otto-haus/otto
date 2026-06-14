# 198 — Contributing local gate docs

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

Contributors can find the reproducible install command and the full local CI gate from `CONTRIBUTING.md`, reducing drift between local proof and GitHub Actions proof.

## Why this matters

The repo already has a shared local gate in `scripts/ci-local-gate.sh` and a `task ci` alias. The contributor guide did not point new contributors at that gate, so PR authors could reasonably run only the shorter historical checks and miss the audit/build/clean-diff requirements CI enforces.

## Scope

- Add `bun install --frozen-lockfile` to `CONTRIBUTING.md`.
- Add `task ci` and the direct `bash scripts/ci-local-gate.sh` fallback to `CONTRIBUTING.md`.
- Leave workflow names, job names, status checks, repository settings, and package scripts unchanged.

## Out of scope

- Renaming the `CI / checks` status check.
- Changing CI workflow behavior.
- Adding dependencies.
- Marking the PR ready for human review.

## Done when

- `CONTRIBUTING.md` documents the frozen install path.
- `CONTRIBUTING.md` documents the full local CI gate.
- The full local gate still passes.
- The PR's `CI / checks` run passes on GitHub.

## Verification

```sh
bun install --frozen-lockfile
bash scripts/ci-local-gate.sh
git diff --check
gh pr checks <pr> --watch
```

## Blocker log

## Execution receipt

Date: 2026-06-14
Branch: `ci/contributing-gate-doc`
Base: `origin/main` at `2d65832d712933078a8b47951e96339c95cb918c`

### What changed

- Added `bun install --frozen-lockfile` to `CONTRIBUTING.md`.
- Added `task ci` as the documented local gate before PRs.
- Added `bash scripts/ci-local-gate.sh` as the fallback when `task` is not installed.
- Left CI workflow names, job names, status check names, package scripts, and repository settings unchanged.

### Docs and standards basis

- Standards decision: go. The change is a narrow contributor-doc update that points to existing repo truth and avoids external settings, releases, or authority drift.
- Context7 basis: Bun docs confirm `bun install --frozen-lockfile` installs exact versions from `bun.lock`, fails when `package.json` disagrees with the lockfile, and does not update the lockfile. Bun docs also identify `bun audit` as the package vulnerability check used by the local gate.

### Local proof

```sh
bun install --frozen-lockfile
git diff --check
task ci
git status --short --branch
```

Result:

- `bun install --frozen-lockfile` passed with Bun `1.3.14`.
- `git diff --check` passed before commit.
- `task ci` passed from the committed state.
- Gate coverage included core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 35 unit tests, `verify:v0`, desktop Electron build, `bun audit`, whitespace check, and clean-worktree check.
- `git status --short --branch` showed no generated writeback noise after the gate.

### Remote proof

Pending PR CI.
