# Staging receipt — 072 Receipts CTA wrong dock

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Smoke

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
```

## Checks

| Path | Result |
|------|--------|
| Secondary → Receipts + sample education | **pass** (`receiptsCtaNotConnectDock=true`) |
| Primary → connect dock | **pass** (`primaryCtaConnectDock=true`) |

Screenshots:

- `docs/receipts/staging/071-072-receipts-sample-onboarding.png` (secondary)
- `docs/receipts/staging/072-primary-connect-dock.png` (primary)

## Artifacts

- `onboarding-smoke-20260614061453.json`
