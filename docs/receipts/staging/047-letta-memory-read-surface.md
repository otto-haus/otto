# Staging receipt — 047 Memory observatory

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Deploy + capture

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-proof-capture.cjs
```

## Checks

- Settings → **Memory observatory** section opens (`memoryObservatorySection=true`)
- Runtime `ready=true` with agent id in staging JSON
- Screenshot: `docs/receipts/staging/047-memory-observatory.png`

## API surface (canon)

- Primary local path: `GET {baseUrl}/v1/blocks?agent_id={agentId}` (Letta local agents)
- Fallback: `GET {baseUrl}/v1/agents/{agentId}/core-memory/blocks`
- Read-only; no write path from Otto UI.

## Rev9 proof (2026-06-14)

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-proof-capture.cjs
```

- `memoryBlockRows=3` in `docs/receipts/staging/staging-proof-20260614070018.json`
- Screenshot: `docs/receipts/staging/047-memory-observatory.png` (live block labels visible)
- Fix: `memory-store.ts` resolves `local:` base URLs via `resolveHttpBaseUrl()` + `/v1/blocks?agent_id=`

## Artifacts

- `docs/receipts/staging/staging-proof-20260614070018.json`
- `docs/receipts/staging/047-memory-observatory.png`
