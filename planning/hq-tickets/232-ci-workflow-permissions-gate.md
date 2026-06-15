# 232 - Gate workflow token permissions

Status: Active
Owner: Codex
Lane: ci

## Outcome

CI and `task ci` fail when GitHub Actions workflows omit explicit `permissions` or introduce broad token write scopes without a narrow allowlist entry.

## What changed

- Added `scripts/verify-workflow-permissions.sh`.
- Wired the verifier into `scripts/ci-local-gate.sh` so local and CI gates match.

## Why

The repo already aims for least-privilege Actions tokens, but that rule can drift as new workflows are added. A small structural gate keeps `permissions:` explicit and makes any future write permission a reviewed, named exception.

## Done when

- The verifier parses `.github/workflows/*.yml` / `.yaml`.
- The verifier rejects missing workflow-level `permissions`.
- The verifier rejects non-map values like `read-all` and `write-all`.
- The verifier rejects unallowlisted `write` scopes.
- The local gate runs the verifier before the expensive build/test steps.
- The PR's own `CI / checks` run passes.

## Execution receipt

Context:

- Context7 `/websites/github_en_actions` confirmed `permissions` supports granular `read`, `write`, and `none` scopes; unspecified permissions become no access once the key is used.

Verification:

- `bash scripts/verify-workflow-permissions.sh` passed on the real workflow set.
- Temporary negative workflows were added and removed locally to verify expected failures:
  - missing workflow-level `permissions`
  - `permissions: write-all`
  - unallowlisted `permissions.contents: write`
- `task ci` passed on committed tree after adding the gate.

PR CI:

- Pending.
