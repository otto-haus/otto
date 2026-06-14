# 158 — Bun-native Dependabot ecosystem

Owner: Codex
Priority: P1
Depends on: 157-ci-dependabot-maintenance
Release bucket: dev-environment

## Outcome

Dependabot tracks otto's dependency graph through the current Bun ecosystem support instead of treating the repo as a generic npm project.

## Why this matters

otto's local and CI install path is Bun plus the text `bun.lock`. Dependabot should inspect the same package-manager surface reviewers and CI rely on, so dependency maintenance PRs do not drift from the real local gate.

## Scope

- Update `.github/dependabot.yml` to use `package-ecosystem: "bun"` for the root dependency graph.
- Rename the grouped minor/patch update group from npm-specific wording to Bun-specific wording.
- Keep the existing GitHub Actions update configuration unchanged.

## Out of scope

- Merging, tagging, releasing, npm publishing, or changing repository settings.
- Changing Dependabot schedules, labels, reviewers, assignees, or security settings.
- Changing dependency versions or regenerating `bun.lock`.
- Changing the CI/checks contract.

## Done when

- `.github/dependabot.yml` uses the Bun package ecosystem for the root dependency graph.
- GitHub Actions Dependabot updates remain configured.
- Verification/proof is recorded in this ticket and the PR.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
task ci
ruby -e 'require "yaml"; y=YAML.load_file(".github/dependabot.yml"); raise "missing bun" unless y.fetch("updates").any? { |u| u["package-ecosystem"] == "bun" }; raise "missing github-actions" unless y.fetch("updates").any? { |u| u["package-ecosystem"] == "github-actions" }'
git diff --check
```

## Blocker log

None yet.

## Execution receipt

Worktree: `/tmp/otto-ci-dependabot`
Branch: `ci/dependabot`

Docs basis:

- Context7 `/github/docs`: Dependabot `version: 2`, `updates`, `github-actions`, grouping, and schedule syntax.
- Context7 `/dependabot/dependabot-core`: Bun example uses `package-ecosystem: "bun"` and `directory: "/"`; Dependabot supports text `bun.lock`.

Changed:

- Updated `.github/dependabot.yml` root dependency updates from `package-ecosystem: "npm"` to `package-ecosystem: "bun"`.
- Renamed the grouped minor/patch update group from `npm-minor-and-patch` to `bun-minor-and-patch`.
- Kept GitHub Actions Dependabot maintenance unchanged.

Proof:

```sh
bun install --frozen-lockfile
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test
bun run verify:v0
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
bun audit
ruby -e 'require "yaml"; y=YAML.load_file(".github/dependabot.yml"); updates=y.fetch("updates"); raise "missing bun" unless updates.any? { |u| u["package-ecosystem"] == "bun" }; raise "missing github-actions" unless updates.any? { |u| u["package-ecosystem"] == "github-actions" }; raise "missing bun group" unless updates.any? { |u| (u["groups"] || {}).key?("bun-minor-and-patch") }'
git diff --check
task ci
```

Result:

- `bun install --frozen-lockfile` passed with no lockfile mutation.
- Core/practices typecheck passed.
- Desktop renderer and Electron typechecks passed.
- `bun test` passed: 35 pass, 0 fail.
- `bun run verify:v0` passed: 5 passed, 0 failed.
- Electron build passed with `OTTO_READINESS_IGNORE_LOCAL_CONFIG=1`.
- `bun audit` passed with no vulnerabilities found.
- Dependabot YAML parsed and asserted `bun`, `github-actions`, and `bun-minor-and-patch`.
- `git diff --check` passed.
- After commit, `task ci` passed against a clean tree.
