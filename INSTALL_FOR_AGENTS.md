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

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop dev
```

For Electron:

```sh
bun run --cwd apps/desktop electron:dev
```

The desktop is honest by design: chat must stay blocked until a real Letta session initializes.

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
