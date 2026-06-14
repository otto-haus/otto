# Staging receipt — 046 Multi-thread conversations

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

- `threadListRendered=true` — `.sidebar__threads` present in staging sidebar
- Screenshot: `docs/receipts/staging/046-sidebar-thread-list.png`

## Not verified this pass

- Two-thread message isolation + relaunch restore (manual multi-step; not automated in capture script)

## Artifacts

- `docs/receipts/staging/staging-proof-20260614061449.json`
- `docs/receipts/staging/046-sidebar-thread-list.png`
