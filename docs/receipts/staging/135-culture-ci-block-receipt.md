# Staging receipt — 135 Culture CI block banner

**Date:** 2026-06-14 (rev9)  
**App:** `/Applications/otto-staging.app`  
**Proof JSON:** `staging-rev7-proof-20260614070123.json`

## Block moment

| Field | Value |
|-------|--------|
| `conversation` | `local-conv-c272e597-0931-4205-8887-5e6073306b26` (smoke, not `default`) |
| `command` | `check ticket 135-demo` |
| `check_id` | `completion-requires-receipts` |
| `block_message` | Not done: missing mapped proof. |
| `receipt_id` | `receipt-*` (written on fail) |
| `standardId` | `no-fake-done` |
| `checkBlockBanner` | **true** (live Chat UI, not synthetic) |
| `checkBlockBannerHasReceiptLink` | **true** |

## Screenshot

`docs/receipts/staging/135-culture-ci-block.png` — CheckBlockBanner in Chat with Open receipt + Open standard.

## Seed fix (rev9)

- `electron-builder.yml` bundles repo `checks/` into `Resources/checks`
- `check-store.ts` resolves seed from `resourcesPath/checks` and `OTTO_ROOT/checks`
- `deploy-staging.sh` copies `checks/` into isolated `$OTTO_HOME/checks` on deploy
