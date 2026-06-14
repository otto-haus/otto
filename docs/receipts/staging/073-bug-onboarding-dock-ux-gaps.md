# Staging receipt — 073 Connect dock UX gaps

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Smoke (narrow layout phase)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
```

## Checks

- Viewport 880×720 after Welcome Skip
- `narrowComposerVisible=true` — chat textarea visible
- Screenshot: `docs/receipts/staging/073-narrow-dock-layout.png`

## Not automated this pass

- Live `status.reason` snippet on not-ready dock (requires disconnected Letta)
- Settings → **Reset onboarding** control click
- First-message auto-dismiss

## Artifacts

- `onboarding-smoke-20260614061453.json`
