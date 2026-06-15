# Receipt — 071 / issue #89 Sample receipt onboarding step

**Date:** 2026-06-14 (updated 2026-06-15)  
**Issue:** [#89](https://github.com/otto-haus/otto/issues/89)

## Automated proof (CI-safe — no staging app)

```sh
bun run typecheck
bun test apps/desktop/src/onboarding-sample-receipt.test.ts
bun test apps/desktop/src/onboarding-receipt-journey.test.ts
bun test apps/desktop/electron/onboarding-step.test.ts
```

Covers:

- Four-step journey (welcome → connect → run → receipt)
- `receipts-preview` secondary CTA path
- Sample label `sample · not live · not from your workspace`
- `otto.receipt.v1` fixture structure for Receipts empty-state split view
- No onboarding receipt copy claiming "coming soon" or "Receipts land"

## Staging smoke (optional — requires disposable staging bundle)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
```

Prior run: `onboarding-smoke-20260614061453.json` (`receiptsCtaShowsSample=true`, `receiptsCtaNotConnectDock=true`).

## Artifacts

- `onboarding-smoke-20260614061453.json`
