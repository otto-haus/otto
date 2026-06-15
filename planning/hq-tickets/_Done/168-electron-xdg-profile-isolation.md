# 168 - Electron XDG Profile Isolation

Owner: Codex
Priority: P1
Depends on: 167
Release bucket: fresh-user-install-readme

## Outcome

A clean-profile README smoke that sets temp `HOME` and `XDG_*` paths can run
`task electron` without Electron falling back to the normal macOS otto browser profile.

## Critique

Ticket 163 fixed the explicit `OTTO_HOME` isolation path. The next clean-profile loop used
the documented isolated profile shape from the goal runner: temp `HOME`, `CHARTER_HOME`,
`MEMORY_DIR`, and `XDG_*`, but no `OTTO_HOME` or `OTTO_USER_DATA_DIR`.

At `task electron`, the dev app started, but the Electron helpers still used the live
macOS browser profile:

```txt
--user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop
```

That is misleading for a fresh-user or agent clean-profile run. The command looks isolated
because `HOME` and `XDG_*` are temporary, but Electron on macOS does not treat `HOME` alone
as a browser-profile override.

## Scope

- Keep the existing explicit `OTTO_USER_DATA_DIR` and `OTTO_HOME` behavior.
- Add a narrow `task electron` fallback from `XDG_STATE_HOME` to
  `$XDG_STATE_HOME/otto/electron-user-data` when no explicit profile override is set.
- Update README and `INSTALL_FOR_AGENTS.md` to say `HOME` alone is not enough and document
  the actual precedence.
- Verify with bounded dev Electron startup proof only.

## Out of scope

- `task refresh`, `smoke:desktop:live`, or `/Applications/otto.app`.
- Staging refresh.
- Real Letta connected-state proof.
- Changing packaged app profile behavior.
- Broad Electron lifecycle cleanup.

## Done when

- With temp `XDG_STATE_HOME` and no `OTTO_HOME` / `OTTO_USER_DATA_DIR`, `task electron`
  launches Electron helpers whose `--user-data-dir` is under
  `$XDG_STATE_HOME/otto/electron-user-data`.
- The scoped worktree Electron process list does not contain
  `/Users/seb/Library/Application Support/@otto-haus/desktop`.
- README and `INSTALL_FOR_AGENTS.md` tell clean-profile runners that `HOME` alone is not
  enough and name the `XDG_STATE_HOME` fallback.
- Focused verification and before/after proof are recorded in this ticket.

## Verification

Commands/checks to run:

```sh
task electron
rg -n "HOME alone is not enough|XDG_STATE_HOME/otto/electron-user-data|OTTO_USER_DATA_DIR|XDG_STATE_HOME" README.md INSTALL_FOR_AGENTS.md Taskfile.yml
git diff --check
```

No `apps/desktop` TypeScript files changed; `task electron` itself is the shell/runtime
verification for the Taskfile edit.

## Blocker log

## Execution receipt

- repo path: `/Users/seb/Code/otto-fresh-user-skill-install-boundary`
- branch: `docs/fresh-user-skill-install-boundary`
- clean discovery clone:
  `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-fresh-user-loop.XXXXXX.lF3HckfJEG/repo`
- first blocker found:
  - `task electron` started from the clean-profile path with temp `HOME`, `CHARTER_HOME`,
    `MEMORY_DIR`, `XDG_CACHE_HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, and
    `XDG_STATE_HOME`, but no `OTTO_HOME` / `OTTO_USER_DATA_DIR`.
  - Startup proof appeared, but process inspection showed Electron helpers using the live
    browser profile:

```txt
task_pid=48019
startup_seen=1
profile_under_temp=no
Electron Helper (GPU) ... --user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop ...
Electron Helper ... --user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop ...
Electron Helper (Renderer) ... --user-data-dir=/Users/seb/Library/Application Support/@otto-haus/desktop ...
```

- files changed:
  - `Taskfile.yml`
  - `README.md`
  - `INSTALL_FOR_AGENTS.md`
  - `planning/hq-tickets/168-electron-xdg-profile-isolation.md`
- implemented:
  - `Taskfile.yml` now preserves explicit `OTTO_USER_DATA_DIR`, then derives from
    `OTTO_HOME`, then derives from `XDG_STATE_HOME`:

```sh
if [ -z "${OTTO_USER_DATA_DIR:-}" ]; then
  if [ -n "${OTTO_HOME:-}" ]; then
    export OTTO_USER_DATA_DIR="$OTTO_HOME/electron-user-data"
  elif [ -n "${XDG_STATE_HOME:-}" ]; then
    export OTTO_USER_DATA_DIR="$XDG_STATE_HOME/otto/electron-user-data"
  fi
fi
```

  - README now warns that clean-profile / CI-style runs must set `OTTO_HOME` or
    `XDG_STATE_HOME`; `HOME` alone is not enough.
  - `INSTALL_FOR_AGENTS.md` now names the same clean-profile requirement and profile
    precedence.
- clean after-fix proof:
  - command: bounded `task electron` from the patched worktree with temp `HOME`,
    `CHARTER_HOME`, `MEMORY_DIR`, and `XDG_*`; no `OTTO_HOME` or `OTTO_USER_DATA_DIR`.
  - startup and process proof:

```txt
task_pid=57985
startup_seen=1
expected_user_data=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-electron-xdg-verify.XXXXXX.Gu9CViziMI/xdg/state/otto/electron-user-data
worktree_electron_processes=4
temp_user_data_seen=yes
live_user_data_seen_in_worktree_electron=no
global_npm_repair_seen=no
Electron Helper (GPU) ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-electron-xdg-verify.XXXXXX.Gu9CViziMI/xdg/state/otto/electron-user-data ...
Electron Helper ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-electron-xdg-verify.XXXXXX.Gu9CViziMI/xdg/state/otto/electron-user-data ...
Electron Helper (Renderer) ... --user-data-dir=/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-electron-xdg-verify.XXXXXX.Gu9CViziMI/xdg/state/otto/electron-user-data ...
```

  - cleanup proof:

```txt
--- remaining worktree/temp processes ---
```

- additional checks run before review:

```txt
rg -n "HOME alone is not enough|XDG_STATE_HOME/otto/electron-user-data|OTTO_USER_DATA_DIR|XDG_STATE_HOME" README.md INSTALL_FOR_AGENTS.md Taskfile.yml
git diff --check
lsof -nP -iTCP:5173 -sTCP:LISTEN
ps -axo pid,command | rg '/Users/seb/Code/otto-fresh-user-skill-install-boundary/node_modules/.bun/electron|otto-electron-xdg-verify\\.XXXXXX\\.Gu9CViziMI|otto-fresh-user-loop\\.XXXXXX\\.lF3HckfJEG' | rg -v 'rg |ps -axo'
```

- proof mapped to Done when:
  - `XDG_STATE_HOME` derived profile: after-fix process proof shows Electron helpers under
    `$XDG_STATE_HOME/otto/electron-user-data`.
  - Live profile absent from scoped worktree Electron: after-fix proof prints
    `live_user_data_seen_in_worktree_electron=no`.
  - Docs name the boundary: `rg` found the new README and agent-install wording.
  - Proof recorded: this ticket includes the before output, after output, commands, and
    known gaps.
- screenshots/artifacts:
  - none; this is CLI/runtime-profile onboarding proof.
- known gaps:
  - No real Letta agent smoke was run.
  - No staging refresh, installed app refresh, or live desktop smoke was run.

## Review

Verdict: +1

Reviewer: Codex PR review lane

Notes:

- Verified the Taskfile profile precedence without launching Electron:
  - explicit `OTTO_USER_DATA_DIR` is preserved.
  - `OTTO_HOME` maps to `$OTTO_HOME/electron-user-data`.
  - `XDG_STATE_HOME` maps to `$XDG_STATE_HOME/otto/electron-user-data` when `OTTO_HOME`
    is absent.
- Re-ran source checks for README / installer docs / Taskfile XDG wording.
- Found and fixed one remaining stale README quick-reference claim:
  - old: `task electron # Electron app wired to local Letta`
  - new: `task electron # Electron dev app; chat connects after Letta session initializes`
- Re-ran stale-claim guard:
  - `wired to local Letta` / `wired to the live Letta runtime` absent from README,
    installer docs, and Taskfile.
- Re-ran verification:
  - `bun run --cwd apps/desktop typecheck`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run typecheck`
  - `git diff --check`
  - `bun test` -> 35 pass / 0 fail
  - `bun run verify:v0` -> 5 passed / 0 failed

This ticket is ready to move to `_Done`.
