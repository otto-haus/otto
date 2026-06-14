# Staging receipt — 127 Command Station culture home

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

- Command Station strip visible on Chat home
- Culture cards: **Constitution**, **Changelog** (`constitutionCard`, `changelogCard=true`)

## Screenshot

`docs/receipts/staging/127-command-station-culture-home.png`

## Artifacts

- `docs/receipts/staging/staging-proof-20260614061449.json`
