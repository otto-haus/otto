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
- Add Mintlify validation and broken-link checks to the shared local CI gate.

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
- Added `bun run docs:validate` and `bun run docs:links` to `scripts/ci-local-gate.sh`.
- Codex reviewer fixed the first implementation so `task ci` also enforces the broken-link check required by this ticket.
- `bun install --frozen-lockfile` passed.
- `task --list` passed and listed the docs tasks.
- `task docs:validate` passed.
- `task docs:links` passed with no broken links.
- `bun run typecheck`, desktop typechecks, `bun test` (35 pass / 0 fail), `bun run verify:v0` (5 passed / 0 failed), Electron build, `bun audit`, and `git diff --check` passed.
- `apps/desktop/src/data/readiness.json` remained clean after Electron build.
- Clean `task ci` passed before reviewer commit.

## Review

Verdict: +1

Evidence:
- Context7 `/mintlify/docs` confirmed `docs.json` navigation groups and the `mint dev`, `mint validate`, and `mint broken-links` CLI commands.
- `task docs:validate` passed.
- `task docs:links` passed with no broken links.
- `scripts/ci-local-gate.sh` now runs both `bun run docs:validate` and `bun run docs:links`.
- `task ci` passed after staging the reviewer repair, including its final clean-diff check.

Unmet Done when items: none.

Exact fixes required: none.

May move to `_Done`: yes.

## Blocker log

Leave blank unless blocked.
