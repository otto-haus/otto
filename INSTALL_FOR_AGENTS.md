# INSTALL_FOR_AGENTS.md

Protocol for an AI coding agent installing Otto.

## Goal

Install Otto locally, verify the repo, and install the Letta Code extension/skills.

## Preconditions

- Git is available.
- Bun is available or can be installed by the human.
- Letta Code is installed if the user wants slash commands/skills.
- `MEMORY_DIR` points at the target agent memory root if skills should be installed automatically.
- Use the Bun package scripts below for install and verification; they do not require Bash or WSL.
- Do not request or print secrets. If a Letta API key is needed, ask the human to enter it in their normal secret manager or local environment.

## Install

```sh
git clone https://github.com/otto-haus/otto.git
cd otto
bun install
```

## Verify repo health

```sh
bun run typecheck
bun test
bun run verify:v0
```

## Install Letta Code commands

```sh
bun run install-extension
```

Then tell the human to run `/reload` in Letta Code.

This installs command files into `~/.letta/extensions/`.

To install the Charter/Routine skills automatically too, set `MEMORY_DIR`:

```sh
MEMORY_DIR=/path/to/agent/memory bun run install-extension
```

If `MEMORY_DIR` is not set, `WARN: MEMORY_DIR not set; skipping skill install.` means the command files were installed but skills were not. Report that state honestly and use the manual copy paths printed by the installer if skills are required.

## Optional desktop check

Web preview only:

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop dev
```

Development Electron:

```sh
task electron
```

This opens a development app from the repo and runs the Electron install preflight first.
It does not install `/Applications/otto.app`.
For clean-profile runs, set `OTTO_HOME` or `XDG_STATE_HOME`; `HOME` alone is not enough
to isolate Electron's macOS browser profile. `task electron` keeps Electron user data
under `$OTTO_HOME/electron-user-data`, then `$XDG_STATE_HOME/otto/electron-user-data`,
unless `OTTO_USER_DATA_DIR` is set explicitly.
If the preflight reports a missing Letta CLI, record that exact state. Otto disables Letta
Code auto-update during dev launch, so do not run global npm repair commands as part of a
clean-profile smoke. Do not call the desktop connected until `session.initialize()`
succeeds against a live Letta agent.
Do not report the installed app as tested unless you deliberately ran an installed-app path:
`task staging` (isolated `/Applications/otto-staging.app`) or, with Sebastian approval,
`OTTO_ALLOW_RELEASE_INSTALL=1 task install:release` (canonical `/Applications/otto.app` from GitHub Release only).
`task refresh` is blocked — it must not overwrite `/Applications/otto.app`.

**Nonintrusive staging (preferred for agents):**

```sh
task staging:build   # build/package only — no launch, no focus steal
task staging         # background launch for CDP smokes (OTTO_WINDOW_MODE=background)
task staging:open    # explicit visible window — use only when debugging UI
```

When `OTTO_SMOKE=1`, packaged Electron defaults to `OTTO_WINDOW_MODE=background` unless
overridden. Set `OTTO_WINDOW_MODE=hidden|minimized|visible` explicitly when needed.
Playwright/CDP smokes (`scripts/otto-staging-*-smoke.cjs`) attach over the debug port and
do not require a focused window.

Optional CLI smoke:

```sh
OTTO_AGENT_ID=<agent-id> task smoke:cli
```

If no real local Letta agent is available yet, record the `SKIP` message instead of
running a fake smoke or using `conversation=default`.

## Done receipt

Report:

- install path
- commands run
- pass/fail status
- any blocker and exact stderr/log path
- whether Letta Code extension install completed
- whether skills installed automatically, were skipped because `MEMORY_DIR` was unset, or were copied manually
- whether desktop was tested

Do not say “installed” if any required command failed.
