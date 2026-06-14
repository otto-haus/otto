# Staging receipt — 046 thread list smoke

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Deploy + capture

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-proof-capture.cjs
```

## Result — `staging-proof-20260614062758.json`

| Check | Result |
|-------|--------|
| `threadListRendered` | **true** |
| Screenshot | `046-sidebar-thread-list.png` |

## Disposable conversation

This capture pass: runtime not initialized (`conversation` unset).

Reference ready session (not `default`):

```txt
conversation=local-conv-80
artifact=docs/receipts/staging/staging-proof-20260614061449.json
```

## Not verified this pass

- Two-thread message isolation + relaunch restore (manual; not in capture script)
