# Otto smoke isolation

Smoke tests must not write into Sebastian's live `conversation=default`.

Use one of these paths:

- Direct CLI: `task smoke:cli` — runs with `--new`, `--no-memfs`, `--no-skills`.
- Desktop/app harness: launch the app executable with `OTTO_SMOKE=1` so Otto creates a disposable conversation and does not persist that conversation id.
- Clean machine E2E (#291): `task smoke:clean-machine` — isolated `HOME`/`OTTO_HOME`, disposable copied `dist-app` bundle, embedded runtime through first chat turn. Never uses `/Applications/otto.app` or `otto-staging.app`.

The live desktop app may use the configured default conversation. Test harnesses may not.

## Clean-machine E2E (#291)

Proves a user with no pre-existing Letta Desktop config can reach a working first chat on a disposable profile.

```sh
bun run --cwd apps/desktop app:dir
NODE_PATH=$HOME/.codex/admin/node_modules task smoke:clean-machine
```

Packaging-only (no Electron launch, useful after `app:dir`):

```sh
OTTO_CLEAN_MACHINE_PACKAGING_ONLY=1 node scripts/otto-clean-machine-e2e-smoke.cjs
```

Failure output includes `failureCategory`: `packaging` | `setup` | `runtime` | `chat`, plus `nextAction`.
