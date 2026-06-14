# Staging receipt — 033 Desktop responsive resize

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Capture

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-rev8-proof.cjs
```

**Manifest:** `staging-rev8-proof-20260614070035.json`

## Proof

Widths 1280 / 1100 / 900 / 640 on Chat, Standards, Settings — no horizontal scroll (`scrollWidth === clientWidth` at each).

| Width | PNGs |
|-------|------|
| 1280 | `033-resize-1280-{chat,standards,settings}.png` |
| 1100 | `033-resize-1100-{chat,standards,settings}.png` |
| 900 | `033-resize-900-{chat,standards,settings}.png` |
| 640 | `033-resize-640-{chat,standards,settings}.png` |

**Runtime:** disposable smoke conversation; `runtimeReady: true`
