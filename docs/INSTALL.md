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

Useful environment variables:

```txt
OTTO_AGENT_ID     target Letta agent
LETTA_BASE_URL    Letta server URL, if needed
LETTA_CLI_PATH    optional specific Letta CLI path
OTTO_HOME         runtime/config root; defaults to ~/.otto
```

Packaged desktop distribution is not the recommended install path yet.
