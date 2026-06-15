# Staging receipt — 073 / #91 Connect dock UX gaps

**Date:** 2026-06-14  
**Issue:** [#91](https://github.com/otto-haus/otto/issues/91)  
**App:** disposable `dist-app` copy (never `/Applications/otto.app` or `otto-staging.app`)

## Done when

| Item | Proof |
|------|-------|
| Not-ready connect step shows `status.reason` / `code` | `Onboarding.tsx` `onboardStatusReason` block |
| First chat send dismisses onboarding | `notifyOnboardingFirstMessage()` in `Chat.tsx` queue drain |
| 880px: composer visible with step shell | `073-narrow-dock-layout.png` + smoke `narrowStepNotCoveringComposer` |
| Settings reset onboarding | Settings → General → **Reset onboarding** → `resetOnboardingForReplay()` |

## Smoke (narrow layout)

```sh
bun run --cwd apps/desktop app:dir
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
```

## Verification

```sh
bun run typecheck
bun test apps/desktop/electron/onboarding-storage.test.ts
```
