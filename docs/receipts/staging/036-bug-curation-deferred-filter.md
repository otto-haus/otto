# Staging receipt — 036 Curation deferred filter

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Capture

```sh
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-036-recapture.cjs
```

**Manifest:** `staging-rev8-proof-20260614070035.json`

## Proof

Deferred proposal `prop_20260614_d750e3b2` (summary: `rev8 staging proof — defer filter visibility`):

| Filter | Deferred visible? |
|--------|-------------------|
| Pending | No (`pendingListHasDeferred: false`) |
| Decided | Yes (`decidedListHasDeferred: true`) |

**Screenshots:** `036-curation-pending-filter.png`, `036-curation-deferred-decided-filter.png`
