# 163 - Electron User Data Isolation

Owner: Codex
Priority: P1
Depends on: 162
Release bucket: fresh-user-install-readme

## Outcome

A fresh user or agent walking the README path can run `task electron` with an isolated
`OTTO_HOME` and get an isolated Electron browser profile automatically, instead of silently
using the normal macOS otto userData profile.

## Critique

After tickets 159-162, the clean-profile path reached `task electron` with temp `HOME`,
`CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`, and `XDG_*` values. The app started, but the
Electron helper process still advertised:

```txt
--user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop
```

That is the first new-user confusion point. The README path says the smoke is isolated, but
Electron was still allowed to select the live macOS userData profile unless the operator
knew an undocumented Electron-specific override. For a clean-profile install path, this is
both misleading and unsafe.

## Scope

- Add a narrow `OTTO_USER_DATA_DIR` Electron userData override.
- Make `task electron` derive `OTTO_USER_DATA_DIR=$OTTO_HOME/electron-user-data` when
  `OTTO_HOME` is set and no explicit override exists.
- Document the runtime truth in README and `INSTALL_FOR_AGENTS.md`.
- Verify with temp-profile `task electron` dev startup proof only.

## Out of scope

- `task refresh`, `smoke:desktop:live`, or `/Applications/otto.app`.
- `task staging` or staging refresh while Sebastian is using staging.
- Real Letta connected-state proof.
- Changing packaged app profile behavior when no override is provided.
- Broad Electron app lifecycle changes.

## Done when

- `task electron` with `OTTO_HOME=<temp>/otto-home` launches Electron helpers whose
  `--user-data-dir` is under `<temp>/otto-home/electron-user-data`.
- The scoped Electron/dev process list does not contain
  `/Users/seb/Library/Application Support/@otto-haus/desktop`.
- `OTTO_USER_DATA_DIR` is documented as the explicit override.
- `INSTALL_FOR_AGENTS.md` tells clean-profile runners to set `OTTO_HOME` and explains the
  derived profile path.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
task electron
rg -n "OTTO_USER_DATA_DIR|electron-user-data|userData|setPath|OTTO_HOME" README.md INSTALL_FOR_AGENTS.md Taskfile.yml apps/desktop/electron/main.ts
git diff --check
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop typecheck
```

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone: `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.y4SXpnrvtw/repo`
- first blocker found:
  - `task electron` started from the clean-profile path, but process inspection showed
    Electron helper processes using `--user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop`.
  - This contradicted the clean-profile README path because `HOME`, `OTTO_HOME`, and `XDG_*`
    were all scoped under the temp root.
- files changed:
  - `apps/desktop/electron/main.ts`
  - `Taskfile.yml`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/163-electron-user-data-isolation.md`
- implemented:
  - `apps/desktop/electron/main.ts` now reads `OTTO_USER_DATA_DIR`, creates the directory,
    resolves the path, and calls `app.setPath('userData', ...)` before `app.whenReady()`.
  - `Taskfile.yml` now derives `OTTO_USER_DATA_DIR="$OTTO_HOME/electron-user-data"` for
    `task electron` when `OTTO_HOME` is set and no explicit override is provided.
  - README documents `OTTO_USER_DATA_DIR` and the `OTTO_HOME` derived profile path.
  - `INSTALL_FOR_AGENTS.md` tells clean-profile runners to set `OTTO_HOME` and names the
    derived profile path.
- clean after-fix proof:
  - command: `task electron` under temp `HOME`, `CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`,
    `XDG_CACHE_HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, and `XDG_STATE_HOME`.
  - startup log:

```txt
Letta Desktop CLI found; first runtime connection may still bootstrap Letta Code with npm.
dev server running for the electron renderer process at:
  Local:   http://localhost:5173/
starting electron app...
```

  - scoped process proof:

```txt
Electron Helper (GPU) ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.y4SXpnrvtw/otto-home/electron-user-data ...
Electron Helper ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.y4SXpnrvtw/otto-home/electron-user-data ...
Electron Helper (Renderer) ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.y4SXpnrvtw/otto-home/electron-user-data ...
profile_under_temp=yes
live_profile_seen=no
```

  - cleanup proof:

```txt
--- remaining scoped electron/dev processes ---
```

- additional checks run before review:
  - `rg -n "OTTO_USER_DATA_DIR|electron-user-data|userData|setPath|OTTO_HOME" README.md INSTALL_FOR_AGENTS.md Taskfile.yml apps/desktop/electron/main.ts`
  - `git diff --check`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run --cwd apps/desktop typecheck`
- proof mapped to Done when:
  - Derived profile path: focused process proof shows Electron helpers using the temp
    `otto-home/electron-user-data` path.
  - Live profile absent: focused process proof prints `live_profile_seen=no`.
  - Explicit override documented: README documents `OTTO_USER_DATA_DIR`.
  - Agent clean-profile instruction: `INSTALL_FOR_AGENTS.md` names `OTTO_HOME` and the
    derived path.
  - Proof recorded: this receipt includes before/after evidence, commands, and known gaps.
- screenshots/artifacts:
  - none; this is a CLI/runtime-profile onboarding fix.
- known gaps:
  - No real Letta agent smoke was run.
  - No staging refresh was run because Sebastian is actively using staging.

## Review attempt

Reviewer agent: `019ec6fa-07a6-7c32-92e9-e0c577bc7685`
Date: 2026-06-14
Result: blocked before review

The reviewer subagent failed before inspecting the ticket or appending a verdict:

```txt
You've hit your usage limit. Visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 1:30 PM.
```

No reviewer `+1` exists yet. This ticket remains in `_InReview`.

## Review attempt

Reviewer agent: `019ec6fe-d30b-7a20-aa7b-1e9a617a1657`
Date: 2026-06-14
Result: blocked before ticket append

The GoalBuddy Judge audited the ticket and reported that the acceptance criteria support
`+1`, but did not append a verdict because its higher-priority role contract was strictly
read-only:

```txt
AC review supports +1: scoped diff is narrow, docs cover OTTO_USER_DATA_DIR and derived OTTO_HOME profile, ticket receipt records isolated process proof with live profile absent, and local static/type checks passed. I did not append because this session has a higher-priority read-only Judge contract forbidding edits.
```

No reviewer `+1` exists yet. This ticket remains in `_InReview` until an append-capable
independent reviewer writes the verdict.

## Review
Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

AC-by-AC evidence:
- `task electron` with temp `OTTO_HOME=<temp>/otto-home` launches Electron helpers under
  `<temp>/otto-home/electron-user-data`: reran a bounded smoke with temp `HOME`,
  `CHARTER_HOME`, `MEMORY_DIR`, `OTTO_HOME`, and `XDG_*`; captured Electron helper
  processes from this worktree with `--user-data-dir=/var/folders/.../otto-review-163b.../otto-home/electron-user-data`.
- Scoped dev/Electron process capture for that smoke did not show
  `/Users/seb/Library/Application Support/@otto-haus/desktop`; the separate live app and
  staging app were not touched.
- `OTTO_USER_DATA_DIR` is documented as the explicit Electron profile override in README.
- `INSTALL_FOR_AGENTS.md` tells clean-profile runners to set `OTTO_HOME` and names the
  derived `$OTTO_HOME/electron-user-data` profile path.
- The ticket receipt records before/after proof and maps proof to every Done-when item.

Evidence inspected:
- Docs/workflow: `planning/hq-tickets/AGENTS.md`, `000-canonical.md`, `000-index.md`,
  `_workflow-review-ticket.md`, and this ticket.
- Diff/code: `apps/desktop/electron/main.ts`, `Taskfile.yml`, `README.md`,
  `INSTALL_FOR_AGENTS.md`.
- Commands: `git diff -- apps/desktop/electron/main.ts Taskfile.yml README.md INSTALL_FOR_AGENTS.md`;
  `rg -n "OTTO_USER_DATA_DIR|electron-user-data|userData|setPath|OTTO_HOME" README.md INSTALL_FOR_AGENTS.md Taskfile.yml apps/desktop/electron/main.ts planning/hq-tickets/_InReview/163-electron-user-data-isolation.md`;
  `git diff --check`; `bun run --cwd apps/desktop electron:typecheck`;
  `bun run --cwd apps/desktop typecheck`; bounded temp-profile `task electron` smoke; leftover-process check.

Defects: none.
Required changes: none.
