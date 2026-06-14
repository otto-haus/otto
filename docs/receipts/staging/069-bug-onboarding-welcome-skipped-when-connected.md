# Staging receipt — 069 Welcome when already connected

**Date:** 2026-06-14 (updated re-run)  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

> **2026-06-14 re-run:** `onboarding-smoke-20260614062759.json` — `connectedFirstWelcomeVisible=true` on fresh smoke profile. Prior run `20260614061453` showed false; see history below.

## Smoke (connected-first phase)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
```

## Result

From `onboarding-smoke-20260614061453.json`:

| Check | Result |
|-------|--------|
| `connectedFirstRuntimeReady` | **true** |
| `connectedFirstWelcomeVisible` | **false** |

**Finding:** Fresh profile + Letta `ready` before any click still skips Welcome overlay. `Onboarding.tsx` lines 51–54 auto-set `started=true` when `rt.status.ready` — step machine fix alone is insufficient.

Screenshot (actual state): `docs/receipts/staging/069-connected-first-state.png`

## Unit

```sh
bun test ./apps/desktop/electron/onboarding-step.test.ts   # 6 pass
```

## Follow-up

Remove or gate auto-start effect so Welcome shows until explicit CTA (ticket Done when item 1).
