# 235 - Add audit task

Status: Active
Owner: Codex
Lane: ci

## Outcome

Contributors can run the CI supply-chain audit check directly with `task audit`.

## What changed

- Added a `Taskfile.yml` `audit` task that runs `bun audit`.

## Why

`bun audit` is already part of the full local/CI gate, but contributors need a fast command for the supply-chain portion when reviewing dependency changes. A dedicated task makes the check discoverable through `task --list` and keeps the command aligned with CI.

## Done when

- `task audit` runs `bun audit`.
- `task --list` includes the new task.
- The full local gate still passes.
- The PR's own `CI / checks` run passes.

## Execution receipt

Context:

- Context7 `/oven-sh/bun` confirmed `bun audit` is the command for checking installed packages for known vulnerabilities.

Verification:

- `bun install --frozen-lockfile`
- `task --list | rg 'audit'`
- `task audit`
- `task ci`

PR CI:

- Pending.
