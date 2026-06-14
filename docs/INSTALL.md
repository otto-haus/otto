# Install Otto

## Development install

```sh
git clone https://github.com/otto-haus/otto.git
cd otto
bun install
```

Verify:

```sh
bun run typecheck
bun test
bun run verify:v0
```

The install and verify package scripts are cross-platform and do not require Bash or WSL.

## Letta Code extension + skills

```sh
bun run install-extension
```

Then run `/reload` in Letta Code.

## Desktop

Web preview:

```sh
bun run --cwd apps/desktop dev
```

Electron preview:

```sh
bun run --cwd apps/desktop electron:dev
```

Packaged staging smoke copy:

```sh
bun run --cwd apps/desktop app:dir
scripts/launch-otto-staging-smoke.sh
```

The staging launcher retags the copied macOS Electron bundle and all helper app
bundle identifiers before signing. This prevents helper lookup crashes when a
local smoke copy uses a different bundle id from `/Applications/otto.app`.

Useful environment variables:

```txt
OTTO_AGENT_ID     target Letta agent
LETTA_BASE_URL    Letta server URL, if needed
LETTA_CLI_PATH    optional specific Letta CLI path
OTTO_HOME         runtime/config root; defaults to ~/.otto
OTTO_STAGING_ROOT local staging root; defaults to ~/.codex/admin/otto-staging
```

Packaged desktop distribution is not the recommended install path yet.
