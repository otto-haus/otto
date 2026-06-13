# Otto Desktop

A v0 Desktop workspace for viewing Otto Practices, mock Runs, and pending Approvals.

## Install

```sh
bun install
```

## Develop

```sh
bun run --cwd apps/desktop dev
```

The dev script regenerates `src/data/practices.json` from `practices/*/practice.yaml` before starting Vite.

## Build

```sh
bun run --cwd apps/desktop build
```

This regenerates Practice data, typechecks the app, and builds the Vite bundle.
