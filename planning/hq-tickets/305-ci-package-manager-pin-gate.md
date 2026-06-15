# 305-ci-package-manager-pin-gate

## Outcome

Keep the Bun version pin in `.bun-version` and `package.json#packageManager` from drifting apart.

## What changed

- Added `scripts/check-package-manager-pin.mjs`.
- Added `bun run check:package-manager`.
- Wired `bun run check:package-manager` into `scripts/ci-local-gate.sh` before heavier typecheck, test, docs, build, and audit steps.

## Why

CI installs Bun from `.bun-version`, while package managers and contributor tooling read `package.json#packageManager`. If those pins diverge, local setup and CI can silently use different Bun versions. This check fails early when the two version sources disagree.

## Scope

No workflow, branch protection, release, publish, or repository setting changes.

## Documentation lookup

- Context7 GitHub/tooling lookup attempted on 2026-06-14.
- Result: quota blocked (`Monthly quota exceeded`). This patch uses repo-local package metadata and does not change GitHub Actions syntax.

## Verification

- `bun -e 'JSON.parse(await Bun.file("package.json").text()); console.log("package.json ok")'` passed.
- `bun run check:package-manager` passed and reported `packageManager matches .bun-version (bun@1.3.14)`.
- Temporary negative fixture with `.bun-version=1.3.14` and `packageManager=bun@0.0.0` failed with `packageManager pin mismatch`.
- `git diff --check` passed.
- `task ci` passed after commit. The gate covered `bun run check:package-manager`, root typecheck, desktop typecheck, Electron typecheck, `bun test` (`258 pass`, `1 skip`, `0 fail`), `bun run verify:v0`, Mintlify docs validation, Mintlify broken-link check, Electron build, `bun audit` (`No vulnerabilities found`), `git diff --check`, and `git diff --exit-code`.
