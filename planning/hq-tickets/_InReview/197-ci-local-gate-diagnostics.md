# 197 — CI local gate diagnostics

Owner: Codex
Priority: P2
Depends on: none
Release bucket: ci/devex

## Outcome

The local CI gate labels each verification step before it runs, so local and GitHub Actions failures point reviewers at the exact gate that failed without changing the required `CI / checks` contract.

## Why this matters

`scripts/ci-local-gate.sh` is the shared proof path for `task ci` and GitHub Actions. Step labels make failures faster to triage while preserving the same gate order and commands.

## Scope

- Add step labels to `scripts/ci-local-gate.sh`.
- Keep the existing local gate command list intact.
- Leave workflow names, job names, status-check names, permissions, and remote settings unchanged.

## Out of scope

- Renaming `CI` or `checks`.
- Changing branch protection or repository settings.
- Adding dependencies.
- Marking the PR ready for human review.

## Done when

- `scripts/ci-local-gate.sh` prints each gate label before running it.
- The full local gate still passes.
- The PR's `CI / checks` run passes on GitHub.
- Proof is recorded in this ticket.

## Verification

```sh
git status --short --branch
bash scripts/ci-local-gate.sh
git diff --check
gh pr checks <pr> --watch
```

## Blocker log

## Execution receipt

Date: 2026-06-14
Branch: `ci/diagnostics-task`
Base: `origin/main` at `2d65832d712933078a8b47951e96339c95cb918c`

### What changed

- Added a `run_gate` wrapper to `scripts/ci-local-gate.sh`.
- Labeled the existing gates:
  - core/practices typecheck
  - desktop renderer typecheck
  - desktop Electron typecheck
  - unit tests
  - v0 verifier
  - desktop Electron build
  - dependency audit
  - diff whitespace check
  - working tree clean check
- Kept the same gate order and commands, including `git diff --exit-code`.

### Docs and standards basis

- Standards decision: go. The change is scoped to local/CI diagnostics, keeps source truth in the shared gate script, avoids remote settings, and preserves the `CI / checks` status-check contract.
- Context7 basis: GitHub Actions docs confirm `workflow_dispatch`/workflow syntax is branch-run aware; this PR does not change workflow triggers, names, permissions, or job identity.

### Local proof

```sh
bun install --frozen-lockfile
bash -n scripts/ci-local-gate.sh
git diff --check
bash scripts/ci-local-gate.sh
```

Result:

- `bun install --frozen-lockfile` passed with Bun `1.3.14`.
- `bash -n scripts/ci-local-gate.sh` passed.
- `git diff --check` passed before commit.
- `bash scripts/ci-local-gate.sh` passed and printed the new `==>` labels before each gate.
- Gate coverage remained: core/practices typecheck, desktop renderer typecheck, desktop Electron typecheck, 35 unit tests, `verify:v0`, desktop Electron build, `bun audit`, whitespace diff check, and clean-worktree check.
- No generated writeback noise remained after the gate.

### Remote proof

Pending PR CI.
