# Staging receipt — 067 Onepagers surface alignment

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

- Standards pane: **The test:** footer visible
- Settings → General: **The test:** footer visible
- Screenshots:
  - `docs/receipts/staging/067-standards-test-footer.png`
  - `docs/receipts/staging/067-settings-test-footer.png`

## Repo

```sh
ls docs/onepagers/*.html | wc -l   # 13 HTML files (2026-06-14)
```

## Artifacts

- `docs/receipts/staging/staging-proof-20260614061449.json`
