# 162 — Git line-ending normalization

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

otto has repository-level Git attributes that keep text files normalized to LF and keep common image/bundle assets out of text normalization.

## Why this matters

`.editorconfig` helps editors, but Git still needs repository-owned normalization rules so contributors on different platforms do not create line-ending churn or accidental binary diffs. This makes CI and review diffs more stable without changing build behavior.

## Scope

- Add `.gitattributes`.
- Normalize text files with LF line endings.
- Mark common image assets and macOS `.app` bundles as binary.

## Out of scope

- Renormalizing the whole repository.
- Changing `.editorconfig`, formatters, dependencies, workflows, or required checks.
- Touching generated assets or build outputs.

## Done when

- `.gitattributes` exists and applies LF normalization for text.
- Common binary assets are marked binary.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
git check-attr text eol -- package.json scripts/ci-local-gate.sh .github/workflows/ci.yml
git check-attr text diff -- .github/assets/otto-avatar.png
task ci
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-gitattributes`
Branch: `ci/gitattributes-lf`

Docs basis:

- Context7 `/git/htmldocs`: Git attributes support `text=auto`, `eol=lf`, and `binary` for binary file handling.

Changed:

- Added `.gitattributes`.
- Set default text normalization to LF.
- Marked common image assets and `.app` bundles as binary.

Proof:

```sh
bun install --frozen-lockfile
git check-attr text eol -- package.json scripts/ci-local-gate.sh .github/workflows/ci.yml
git check-attr text diff -- .github/assets/otto-avatar.png
task ci
git diff --check
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- `git check-attr text eol -- package.json scripts/ci-local-gate.sh .github/workflows/ci.yml` returned `text: auto` and `eol: lf` for each checked text file.
- `git check-attr text diff -- .github/assets/otto-avatar.png` returned `text: unset` and `diff: unset`.
- `task ci` passed: core/practices typecheck, desktop typecheck, Electron typecheck, 35 tests, `verify:v0`, Electron build, `bun audit` with no vulnerabilities, `git diff --check`, and clean diff exit.
- `git diff --check` passed before commit.
