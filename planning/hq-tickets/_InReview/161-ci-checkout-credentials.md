# 161 — Do not persist checkout credentials in CI

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

The read-only CI job checks out the repository without leaving the GitHub token configured for later git commands.

## Why this matters

The `checks` job only needs to read source code and run local gates. Persisting checkout credentials expands the token surface inside the job without adding value, especially because the workflow never pushes, tags, publishes, or writes back.

## Scope

- Set `persist-credentials: false` for `actions/checkout` in `.github/workflows/ci.yml`.
- Keep the existing workflow triggers, permissions, concurrency, timeout, job name, and gate steps unchanged.

## Out of scope

- Pinning action SHAs.
- Changing repository settings, required checks, tokens, secrets, or branch protection.
- Adding write permissions or any push/publish behavior.
- Renaming the `CI / checks` contract.

## Done when

- `actions/checkout` opts out of persisted credentials.
- The existing CI gate still passes locally and on the PR.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/ci.yml
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-checkout-creds`
Branch: `ci/checkout-credentials`

Docs basis:

- Context7 `/actions/checkout`: checkout persists the token by default; `persist-credentials: false` opts out.

Changed:

- Added `with: persist-credentials: false` to the checkout step.
- Left the rest of the workflow unchanged.

Proof:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/ci.yml
task ci
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `actionlint .github/workflows/ci.yml` passed.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
