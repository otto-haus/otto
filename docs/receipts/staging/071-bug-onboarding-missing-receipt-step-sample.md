# Staging receipt — 071 Sample receipt onboarding step

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

- Secondary CTA **See what Receipts will prove** → Receipts surface
- Visible **Sample proof record** heading (`receiptsCtaShowsSample=true`)
- Screenshot: `docs/receipts/staging/071-072-receipts-sample-onboarding.png`

Sample labeling (`sample · not live · not from your workspace`) present in detail toolbar (may be off-screen in full-page capture).

## Artifacts

- `onboarding-smoke-20260614061453.json`
