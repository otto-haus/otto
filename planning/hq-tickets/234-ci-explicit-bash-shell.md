# 234 - Pin CI run shell

Status: Active
Owner: Codex
Lane: ci

## Outcome

The `CI / checks` workflow uses an explicit bash shell for every `run:` step instead of inheriting the runner default.

## What changed

- Added workflow-level `defaults.run.shell: bash` to `.github/workflows/ci.yml`.

## Why

The local gate is bash-oriented (`scripts/ci-local-gate.sh` uses `set -euo pipefail`). Pinning the workflow run shell keeps CI behavior explicit as workflows evolve and avoids relying on runner defaults.

## Done when

- `.github/workflows/ci.yml` parses as valid YAML.
- `defaults.run.shell` is set to `bash`.
- The workflow name/job/check contract remains `CI / checks`.
- The local gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

Context:

- Context7 `/websites/github_en_actions` confirmed workflow/job `defaults.run.shell: bash` is supported for `run` steps.

Verification:

- `bun install --frozen-lockfile`
- `ruby -e 'require "yaml"; data = YAML.load_file(".github/workflows/ci.yml"); raise "missing shell" unless data.fetch("defaults").fetch("run").fetch("shell") == "bash"; raise "wrong workflow" unless data.fetch("name") == "CI"; raise "missing checks job" unless data.fetch("jobs").key?("checks")'`
- `task ci`

PR CI:

- Pending.
