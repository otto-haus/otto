# Otto smoke isolation

Smoke tests must not write into Sebastian's live `conversation=default`.

Use one of these paths:

- Capability: `task smoke:letta-cli` — proves `resolveCli`, `--version`, and `--help` from otto's runtime context. Set `LETTA_AGENT_ID` for an opt-in disposable `--new` turn (never `conversation=default`).
- Direct CLI: `task smoke:cli` — runs with `--new`, `--no-memfs`, `--no-skills`.
- Letta cron / reminders: `OTTO_AGENT_ID=<agent-id> task smoke:cron` — creates a one-shot task on `otto-cron-smoke-<timestamp>`, verifies prompt/agent/conversation binding, then deletes it.
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

## Sleep/wake robustness (#318)

`scripts/otto-staging-sleep-wake-smoke.cjs` exercises suspend/resume using disposable state:

- Seeds chat draft + unsent queue in isolated localStorage
- Simulates Mac sleep via `visibilitychange` hidden/visible, then reload + app relaunch
- Asserts draft/queue survive, runtime status is readable, scheduled routines report deferred/allowed explicitly
- Dreams/background loops report `not_wired` until Labs ships that surface

Never uses `/Applications/otto.app`. Default template is `/Applications/otto-staging.app` (read-only copy via `ditto` into `/tmp`).

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-sleep-wake-smoke.cjs
```

Or via task:

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  task smoke:staging:sleep-wake
```
