# otto Desktop

A v0.1 Desktop workspace for local otto chat, setup, and honest coming-soon workspace panes.

## Install

```sh
bun install
```

## Develop

```sh
# web preview — fast UI iteration, no desktop bridge (chat is disabled here)
bun run --cwd apps/desktop dev

# full desktop app, wired to a local Letta runtime
bun run --cwd apps/desktop electron:dev
```

The non-chat workspace panes are placeholders in v0.1 until their real loaders land.

## Build

```sh
bun run --cwd apps/desktop build
```

This typechecks the app and builds the Vite bundle.

## Release gate

```sh
task release:gate
```

Runs lint, typechecks, unit tests, `verify:v0`, Electron build, and regression guards for icon rendering, coming-soon placeholders, and local Letta discovery copy.
