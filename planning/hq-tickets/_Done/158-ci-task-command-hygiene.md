# 158 — CI Task Command Hygiene

Owner: Codex
Priority: P1
Depends on: 156, 157
Release bucket: dev environment

## Outcome

The common Taskfile commands steer contributors toward staging by default, avoid local readiness writeback during build/package, and require an explicit opt-in before replacing `/Applications/otto.app`.

## Why this matters

The local task surface is part of the CI/dev-environment contract. A safe default keeps build proof from disrupting Sebastian's live app or creating noisy generated diffs.

## Scope

- Make `task staging` / `task deploy` the safe packaged-app path.
- Keep `task refresh` available for live app replacement, but require `OTTO_ALLOW_LIVE_REFRESH=1`.
- Make direct `scripts/refresh-otto-app.sh` calls use the same live-replacement guard.
- Run task build/package against the committed readiness baseline.
- Add desktop package metadata so electron-builder does not warn about missing description/author/package manager.

## Out of scope

- Changing Electron signing, notarization, release publishing, or ASAR strategy.
- Replacing the local ticket conveyor.
- Changing CI required checks or repo settings.

## Done when

- `task refresh` refuses to replace `/Applications/otto.app` unless `OTTO_ALLOW_LIVE_REFRESH=1`.
- Direct `scripts/refresh-otto-app.sh` calls have the same guard.
- `task build` and `task package` pass without dirtying `apps/desktop/src/data/readiness.json`.
- The local gate passes after commit.

## Verification

```sh
bun install --frozen-lockfile
task --list
task refresh
bash scripts/refresh-otto-app.sh
task build
task package
bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test
bun run verify:v0
bun audit
git diff --check
```

## Execution receipt

- `task --list` passed and shows `staging` as the safe deploy task with `deploy` alias.
- `task refresh` exited before build/install with the `OTTO_ALLOW_LIVE_REFRESH=1` guard.
- `bash scripts/refresh-otto-app.sh` exited before build/install with the same guard.
- `task build` passed and left `apps/desktop/src/data/readiness.json` clean.
- `task package` passed; electron-builder no longer warned about missing desktop package description, author, or package manager.
- `bun run typecheck`, desktop typechecks, `bun test`, `bun run verify:v0`, `bun audit`, and `git diff --check` passed.

## Blocker log

Leave blank unless blocked.

## Review

Verdict: +1

Reviewer: Codex PR review agent

Notes:
- `task refresh` refuses before build/install without `OTTO_ALLOW_LIVE_REFRESH=1` (exit 201 from go-task precondition).
- `bash scripts/refresh-otto-app.sh` refuses before build/install without `OTTO_ALLOW_LIVE_REFRESH=1` (exit 2 from script guard).
- `task --list` now shows `staging` as the safe deploy task with `deploy` alias, while `refresh` is explicitly live-gated.
- `task build` and `task package` passed and left `apps/desktop/src/data/readiness.json` clean.
- `task package` no longer emits the previous missing description/author/package-manager warnings; the remaining ASAR notice is pre-existing and documented out of scope.
- Local verification passed: typechecks, `bun test`, `verify:v0`, `bun audit`, and `task ci`.
- Data proof recorded in `docs/receipts/staging/pr-157/codex-review-task-command-hygiene.json`.
