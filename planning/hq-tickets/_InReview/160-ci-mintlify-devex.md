# 160 — Mintlify DevEx Docs

Owner: Codex
Priority: P1
Depends on: 156, 157
Release bucket: dev environment

## Outcome

otto has a Mintlify-backed DevEx docs root that contributors can preview and validate locally.

## Why this matters

Contributor workflow is part of the build contract. A validated docs surface makes the local gate, staging loop, and setup path easier to keep current.

## Scope

- Add `devex/docs.json` and a small Mintlify page set.
- Add pinned Mintlify CLI package invocations through `docs:*` scripts.
- Add Taskfile wrappers for docs preview, validation, and link checks.
- Add Mintlify validation to the shared local CI gate.

## Out of scope

- Hosted Mintlify deploy setup.
- Mintlify tokens or secrets.
- Repo settings, DNS, custom domains, release publishing, or tags.

## Done when

- `task docs:validate` passes.
- `task docs:links` passes or reports no broken links.
- `task ci` passes.
- CI passes on the PR.

## Verification

```sh
bun install --frozen-lockfile
task --list
task docs:validate
task docs:links
task ci
```

## Execution receipt

- Used Context7 for current Mintlify docs: `docs.json`, navigation groups, `mint dev`, `mint validate`, and `mint broken-links`.
- Added `devex/docs.json` plus four MDX pages: DevEx overview, local setup, local CI gate, and desktop staging.
- Added pinned Mintlify CLI commands through `bunx --bun mint@4.2.616`.
- Added `task docs:dev`, `task docs:validate`, and `task docs:links`.
- Added `bun run docs:validate` to `scripts/ci-local-gate.sh`.
- `bun install --frozen-lockfile` passed.
- `task --list` passed and listed the docs tasks.
- `task docs:validate` passed.
- `task docs:links` passed with no broken links.
- `bun run typecheck`, desktop typechecks, `bun test`, `bun run verify:v0`, Electron build, `bun audit`, and `git diff --check` passed.
- `apps/desktop/src/data/readiness.json` remained clean after Electron build.
- Clean `task ci` passed from commit `f7de3b7`.

## Blocker log

Leave blank unless blocked.
