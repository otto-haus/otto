# 076 — embedded bootstrap staging proof

Disposable staging profile only. Live `/Applications/otto.app` is never touched.

## Path

1. **Deploy staging** — `bash apps/desktop/scripts/deploy-staging.sh`
   - App: `/Applications/otto-staging.app`
   - Profile: `~/.codex/admin/otto-staging/profile`
   - OTTO_HOME: `~/.codex/admin/otto-staging/otto-home`
   - CDP port: `9445`
2. **Open app** — deploy script launches with `--user-data-dir` + `--remote-debugging-port`
3. **Skip onboarding** — `otto.onboarded.v1=1` + Skip overlay if present
4. **Runtime init** — `window.otto.runtime.init()` until `ready: true` (disposable smoke conversation, not `default`)
5. **One chat turn** — `window.otto.runtime.send(...)` until promise resolves (~10s)

## Commands

```sh
bash apps/desktop/scripts/deploy-staging.sh
bash scripts/embedded-letta-smoke.sh
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs
```

## Artifacts (rev10 — latest verification 2026-06-14)

| Artifact | Path |
|----------|------|
| JSON proof | `docs/receipts/staging/staging-076-bootstrap-proof-20260614073925.json` |
| Screenshot | `docs/receipts/staging/076-embedded-bootstrap-20260614073925.png` |
| CLI smoke | `receipts/otto-v01/embedded-letta-smoke-20260614T073920Z.md` |
| CLI smoke JSON | `receipts/otto-v01/embedded-letta-smoke-20260614T073920Z.json` (cliResolved; chain with `OTTO_BOOTSTRAP_PROOF=1` for bootstrapTurnCompleted) |

Optional one-shot CLI + bootstrap:

```sh
OTTO_BOOTSTRAP_PROOF=1 NODE_PATH=$HOME/.codex/admin/node_modules bash scripts/embedded-letta-smoke.sh
# → embedded-letta-smoke-*.json with bootstrapTurnCompleted: true
```

Key fields: `bootstrapTurnCompleted: true`, `cliResolved: true`, bundled `cliPath` under `otto-staging.app`.

## Honest gaps (still open vs full Done-when)

- Fresh Mac drag-install without prior Letta — not run (staging uses host Letta settings via `OTTO_LETTA_SETTINGS_PATH` when present).
- `~/.otto/letta/` isolated embedded state dir — not wired; staging uses `~/.codex/admin/otto-staging/otto-home`.
- Provider write-only Settings proof — boolean-only config check only (no key submit in this run).
- Reviewer +1 — not self-certified.
