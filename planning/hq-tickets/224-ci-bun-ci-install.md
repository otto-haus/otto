# 224 - CI Bun native frozen install

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

GitHub Actions uses Bun's native CI install command while keeping the same frozen-lockfile install contract.

## Why this matters

Bun documents `bun ci` as the CI/CD form equivalent to `bun install --frozen-lockfile`: install exact versions from `bun.lock` and fail when `package.json` disagrees with the lockfile. Using the native command makes the workflow intent clearer without widening permissions or changing the `CI / checks` contract.

## Scope

- Replace the CI dependency install command with `bun ci`.
- Keep the existing lockfile mutation check after install.
- Record this CI/devex cycle in the ticket conveyor.

## Out of scope

- Changing action versions or pinning actions.
- Changing repository settings or required checks.
- Changing dependency versions.

## Done when

- `.github/workflows/ci.yml` installs dependencies with `bun ci`.
- `actionlint` passes for the workflow.
- The local CI gate passes.
- The PR's own `CI / checks` run is green.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
actionlint
task ci
git diff --check HEAD~1 HEAD
```

## Blocker log

Leave blank unless blocked.
