# Staging receipt — 069 connected-first onboarding smoke

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Smoke (after Phase C label fix)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-onboarding-smoke.cjs
```

## Result — `onboarding-smoke-20260614062759.json`

| Phase | Check | Result |
|-------|-------|--------|
| A (069) | `connectedFirstRuntimeReady` | **true** |
| A (069) | `connectedFirstWelcomeVisible` | **true** |
| B (071–072) | `receiptsCtaShowsSample` | **true** |
| B | `receiptsCtaNotConnectDock` | **true** |
| C (072) | `primaryCtaConnectDock` | **true** (button **Get started →** → dock **Finish connecting otto**) |
| D (073) | `narrowComposerVisible` | **true** |

**Smoke exit:** `ok: true`

## Script fix

`scripts/otto-staging-onboarding-smoke.cjs` Phase C/D now use **Get started →** (replaces retired **Connect local Letta →** label).

## Screenshots

- `069-connected-first-state.png`
- `071-072-receipts-sample-onboarding.png`
- `072-primary-connect-dock.png`
- `073-narrow-dock-layout.png`
