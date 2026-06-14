# 203 — PR template gate proof

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

Every new PR starts with proof prompts that match the repo's full local gate and ask for the reviewer-facing screenshot/data evidence or an explicit N/A.

## Why this matters

The PR template still listed the smaller historical proof set. That lets authors omit frozen install proof, desktop typechecks, Electron build, audit, clean-diff checks, and the remote `CI / checks` run link even though those are the actual review/merge proof contract.

## Scope

- Update `.github/pull_request_template.md` proof checklist.
- Keep `CI / checks` named exactly as-is.
- Leave workflows, branch protection, repository settings, package scripts, and task commands unchanged.

## Out of scope

- Changing GitHub repository settings.
- Renaming checks.
- Marking the PR ready for human review.
- Adding issue templates or multiple PR templates.

## Done when

- PR template asks for frozen install proof.
- PR template asks for full local gate proof via `task ci` or the direct script fallback.
- PR template asks for the remote `CI / checks` run link.
- PR template asks for screenshot/data proof or explicit N/A.
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
Branch: `ci/pr-template-gate-proof`
Base: `origin/main` at `f8cd78a63368327a5f3fea6b61cdca049af324a9`

### What changed

- Updated `.github/pull_request_template.md` so new PRs ask for:
  - `bun install --frozen-lockfile`
  - `task ci` or `bash scripts/ci-local-gate.sh`
  - the PR CI `CI / checks` run link
  - screenshot/data proof or explicit N/A with reason
- Left workflows, package scripts, task commands, branch protection, and repo settings unchanged.

### Docs and standards basis

- Standards decision: go. The change is a scoped contributor-template update that improves proof quality without changing remote settings or check identity.
- Context7 basis: GitHub docs confirm `.github/pull_request_template.md` is a supported repository pull request template location, and the template contents are shown automatically to contributors when they create a PR from the default branch.

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
- Gate coverage included core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 36 unit tests, `verify:v0`, desktop Electron build, `bun audit`, whitespace check, and clean-worktree check.
- `git status --short --branch` showed no generated writeback noise after the gate.

### Remote proof

Pending PR CI.
