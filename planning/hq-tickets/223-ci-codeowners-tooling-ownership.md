# 223 - CI CODEOWNERS tooling ownership

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

CI/CD and contributor-tooling files have explicit CODEOWNERS coverage in addition to the repository-wide default owner.

## Why this matters

otto's build and review gates should not silently lose ownership if the broad default CODEOWNERS rule changes later. Explicit ownership on workflow, script, task, package, lockfile, and Bun-version paths keeps gate changes routed to the same maintainer review boundary.

## Scope

- Add explicit CODEOWNERS patterns for CI/CD and contributor-tooling surfaces.
- Keep the existing repository-wide owner rule intact.
- Record this cycle's CI/devex intent in the ticket conveyor.

## Out of scope

- Changing branch protection or repository rulesets.
- Marking any pull request ready for review.
- Changing workflow jobs, actions, or package dependencies.

## Done when

- `.github/CODEOWNERS` explicitly names CI/CD and contributor-tooling paths.
- The local CI gate still passes.
- The PR's own `CI / checks` run is green.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task ci
git diff --check
```

## Blocker log

Leave blank unless blocked.
