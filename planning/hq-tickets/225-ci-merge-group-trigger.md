# 225 - CI merge queue trigger

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

The existing `CI / checks` workflow also runs when GitHub creates a merge group for a queued pull request.

## Why this matters

GitHub Actions treats `merge_group` as a separate event from `pull_request` and `push`. GitHub documents that repositories using required checks with merge queue need this trigger, or required status checks may not run when a PR enters the queue. Adding the trigger now keeps the current `CI / checks` contract ready for merge queue without changing repository settings.

## Scope

- Add `merge_group` with `checks_requested` to `.github/workflows/ci.yml`.
- Keep the existing `pull_request` and `push` triggers.
- Keep the existing `checks` job name and local gate command.

## Out of scope

- Enabling merge queue or changing repository rulesets.
- Renaming required checks.
- Changing workflow permissions, dependencies, or action versions.

## Done when

- `.github/workflows/ci.yml` includes the `merge_group` trigger.
- `actionlint` passes.
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
