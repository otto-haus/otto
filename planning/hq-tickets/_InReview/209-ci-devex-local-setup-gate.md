# 209-ci-devex-local-setup-gate

Owner: Codex
Status: In review

## Outcome

New contributors are pointed at the full local CI gate during setup instead of a
partial three-command check.

## What changed

- Updated `devex/local-setup.mdx` so first checks use `task ci`.
- Linked setup readers to `devex/ci-gate.mdx` for the current gate command list.

## Why

`task ci` runs `scripts/ci-local-gate.sh`, which mirrors the GitHub `CI / checks`
job. The setup guide should make the full gate the obvious first verification
path so local proof does not drift from PR proof.

## Execution receipt

- Branch: `ci/devex-local-setup-gate`
- Worktree: `/tmp/otto-ci-devex-local-setup-gate`
- Local verification: `task ci` passed on 2026-06-14.
- PR: pending
- PR CI: pending
