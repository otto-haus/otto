# otto Desktop

A v0 Desktop workspace for local otto chat, setup, and honest coming-soon workspace panes.

## Install

```sh
bun install
```

## Develop

```sh
bun run --cwd apps/desktop dev
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
