# 163 — Workflow lint task

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

Contributors and review agents have a first-class `task lint:workflows` command for checking GitHub Actions workflow syntax before opening or reviewing CI changes.

## Why this matters

Workflow changes need a quick local check before the PR's own CI run. Agents have been running `actionlint` ad hoc; a named task makes that check discoverable and provides a YAML parse fallback on machines that do not have `actionlint` installed.

## Scope

- Add `scripts/lint-workflows.sh`.
- Add `task lint:workflows`.
- Prefer `actionlint` when installed.
- Fall back to parsing `.github/workflows/*.yml` and `.github/workflows/*.yaml` with Ruby's YAML parser when `actionlint` is unavailable.

## Out of scope

- Adding new dependencies.
- Changing the CI workflow or required checks.
- Making workflow lint part of the full `task ci` gate.
- Renaming any existing tasks.

## Done when

- `task lint:workflows` runs `actionlint` when available.
- The fallback path parses workflow YAML when `actionlint` is not available.
- The normal local gate still passes.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task lint:workflows
PATH="/usr/bin:/bin:/usr/sbin:/sbin" bash scripts/lint-workflows.sh
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-workflow-lint`
Branch: `ci/workflow-lint-task`

Docs basis:

- Context7 `/go-task/task`: Taskfile tasks support `desc`, `aliases`, and `cmds` command lists.
- Context7 `/rhysd/actionlint`: `actionlint` can run without arguments from a repository to discover and lint `.github/workflows` files; it exits nonzero on lint failures.

Changed:

- Added `scripts/lint-workflows.sh`.
- Added `task lint:workflows`.

Proof:

```sh
bun install --frozen-lockfile
task lint:workflows
PATH="/usr/bin:/bin:/usr/sbin:/sbin" bash scripts/lint-workflows.sh
task ci
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `bash -n scripts/lint-workflows.sh` passed.
- `task --list` showed `lint:workflows`.
- `task lint:workflows` passed using local `actionlint`.
- `PATH="/usr/bin:/bin:/usr/sbin:/sbin" bash scripts/lint-workflows.sh` passed and printed `parsed .github/workflows/ci.yml`.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
