# 164 — CodeQL code scanning workflow

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

otto has a dedicated CodeQL workflow that produces GitHub code scanning results for the JavaScript and TypeScript codebase.

## Why this matters

Repository rules can require code scanning results only after a tool produces those results for pull requests and the protected reference. The current main branch has CI status checks, but no code scanning producer. A pinned CodeQL workflow gives GitHub a first-party code scanning result source without changing repository settings.

## Scope

- Add `.github/workflows/codeql.yml`.
- Analyze `javascript-typescript` with the CodeQL `security-and-quality` query suite.
- Run on pull requests, pushes to `main`, and a weekly schedule.
- Pin workflow actions to immutable commit SHAs.
- Grant only `contents: read` and `security-events: write`, because uploading code scanning results requires the security-events permission.

## Out of scope

- Enabling repository rulesets, branch protection, or required checks.
- Enabling GitHub Code Quality.
- Adding third-party scanners or dependencies.
- Changing the existing `CI / checks` contract.
- Publishing, tagging, releasing, or merging.

## Recommended repository settings after merge

- Keep `Require status checks to pass` enabled for `CI / checks`.
- Enable `Block force pushes`.
- Enable `Require code scanning results` only after this workflow has run successfully on `main`; choose the CodeQL tool and start with errors/high severity before tightening.
- Do not enable `Require code quality results` until GitHub Code Quality is configured and producing pull request results for this repository.

## Done when

- CodeQL workflow syntax lints locally.
- The full local CI gate still passes.
- The PR's own CodeQL workflow run completes successfully and uploads a code scanning result.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/codeql.yml
task ci
git diff --check
gh pr checks <number> --watch
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-codeql`
Branch: `ci/codeql-scanning`

Docs basis:

- Context7 `/github/docs`: rulesets can require code scanning results; CodeQL can analyze `javascript-typescript`; `security-events: write` is the permission used for code scanning result upload.
- Upstream tag resolution: `actions/checkout` `v4` -> `34e114876b0b11c390a56381ad16ebd13914f8d5`; `github/codeql-action` `v4.36.2` -> `8aad20d150bbac5944a9f9d289da16a4b0d87c1e`.

Changed:

- Added `.github/workflows/codeql.yml`.

Proof:

```sh
bun install --frozen-lockfile
actionlint .github/workflows/codeql.yml
task ci
git diff --check
gh pr checks <number> --watch
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `actionlint .github/workflows/codeql.yml` passed.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
