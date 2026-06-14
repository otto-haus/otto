# 295-ci-mintlify-pin-gate

## Outcome

Keep the DevEx docs gate pinned to a deterministic Mintlify CLI version.

## What changed

- Added `scripts/check-mintlify-pins.mjs`.
- Added `bun run check:docs-tools`.
- Wired `bun run check:docs-tools` into `scripts/ci-local-gate.sh` before the Mintlify validate and broken-link checks run.

## Why

The DevEx docs gate uses `bunx` to run Mintlify. The package scripts are pinned today, but nothing prevents a future edit from drifting back to a floating `mint` invocation. This check keeps docs validation reproducible across local runs and CI.

## Scope

No workflow, branch protection, release, publish, or repository setting changes.

## Documentation lookup

- Context7 GitHub/tooling lookup attempted on 2026-06-14.
- Result: quota blocked (`Monthly quota exceeded`). This patch uses repo-local package scripts and does not change GitHub Actions syntax.

## Verification

- `bun -e 'JSON.parse(await Bun.file("package.json").text()); console.log("package.json ok")'` passed.
- `bun run check:docs-tools` passed and reported `Mintlify scripts pinned to mint@4.2.616`.
- Temporary negative fixture with floating `bunx --bun mint validate` failed with `docs:validate must use bunx --bun mint@<exact-version>`.
- `git diff --check` passed.
- `task ci` passed after commit. The gate covered root typecheck, desktop typecheck, Electron typecheck, `bun test` (`258 pass`, `1 skip`, `0 fail`), `bun run verify:v0`, `bun run check:docs-tools`, Mintlify docs validation, Mintlify broken-link check, Electron build, `bun audit` (`No vulnerabilities found`), `git diff --check`, and `git diff --exit-code`.
