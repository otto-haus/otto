# 220-ci-bunfig-frozen-install

Owner: Codex
Status: In review

## Outcome

Plain local `bun install` now defaults to the same frozen-lockfile behavior that
CI requires.

## What changed

- Added `bunfig.toml`.
- Set `[install] frozenLockfile = true`.

## Why

CI already runs `bun install --frozen-lockfile` and checks `bun.lock` for
mutation. This makes the local default match that supply-chain expectation so a
fresh checkout is less likely to rewrite the lockfile accidentally before a PR.

Dependency update work can still intentionally regenerate `bun.lock` by
overriding the frozen install behavior for that command.

## Execution receipt

- Branch: `ci/bunfig-frozen-install`
- Worktree: `/tmp/otto-ci-bunfig-frozen-install`
- Local verification:
  - `bun install --frozen-lockfile` passed before editing.
  - `python3 -c 'import pathlib, tomllib; print(tomllib.loads(pathlib.Path("bunfig.toml").read_text()))'` passed.
  - `bun install` passed with no changes after `frozenLockfile = true`.
  - `task ci` passed.
- PR: pending
- PR CI: pending
