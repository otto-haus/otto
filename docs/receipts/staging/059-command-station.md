# Staging receipt — 059 Command Station thin dashboard

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Deploy

```sh
bash apps/desktop/scripts/deploy-staging.sh
```

## This pass (`20260614063245`)

| Check | Result |
|-------|--------|
| `CommandStationStrip` visible | **false** when `runtime.ready === false` |
| Live numeric counts | **not visible** — strip gated on ready in `Chat.tsx` |
| Thread list + Checks nav | **true** (sidebar wired) |

Honest note: ops count cards only render after runtime connects.

## Prior ready-session proof (counts + culture cards)

From `staging-proof-20260614061449.json` (`runtimeReady: true`, disposable `local-conv-80`):

| Check | Result |
|-------|--------|
| `commandStationVisible` | **true** |
| `constitutionCard` | **true** |
| `changelogCard` | **true** |

Screenshot: `docs/receipts/staging/127-command-station-culture-home.png`

## Code behavior (059)

`Chat.tsx` loads proposals/receipts/tickets/approvals via IPC when connected; `CommandStationStrip` shows `—` for zero counts (no fabricated zeros).

## Artifacts

- `docs/receipts/staging/staging-proof-20260614062758.json` (culture cards, runtime not ready)
- `docs/receipts/staging/staging-proof-20260614061449.json` (ready session reference)
