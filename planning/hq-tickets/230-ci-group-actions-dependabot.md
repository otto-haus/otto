# 230 - CI group GitHub Actions Dependabot updates

Owner: Codex
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

Dependabot groups non-major GitHub Actions version updates into a single maintenance PR.

## Why this matters

The npm ecosystem already groups minor and patch version updates, but GitHub Actions updates currently open separately. Grouping action minor/patch updates reduces CI review noise while leaving major updates separate for explicit review.

## Scope

- Add a GitHub Actions Dependabot group for minor and patch version updates.
- Keep the existing schedule, labels, and commit-message settings.
- Keep major GitHub Actions updates ungrouped.

## Out of scope

- Changing package ecosystems.
- Changing dependency versions.
- Changing repository Dependabot or security settings.

## Done when

- `.github/dependabot.yml` defines a `github-actions-minor-and-patch` group.
- The Dependabot YAML parses successfully.
- The local CI gate passes.
- The PR's own `CI / checks` run is green.

## Verification

Commands/checks to run:

```sh
bun install --frozen-lockfile
ruby -e 'require "yaml"; YAML.load_file(".github/dependabot.yml")'
task ci
git diff --check HEAD~1 HEAD
```

## Blocker log

Leave blank unless blocked.
