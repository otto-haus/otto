# Staging receipt — 048 Propose from correction

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Unit verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
```

## Staging E2E (rev9)

**Manifest:** `staging-rev8-proof-20260614070035.json`

- Chat correction → proposal `prop_20260614_e96b6329` (`needs_approval`)
- Summary: `Always cite message evidence when proposing from Chat correction.`
- Visible in Curation pending (`visibleInCuration: true`)
- Receipt: `receipt-0d9833ba-cebd-4e09-b8f4-5e125780d28e`

**Screenshot:** `048-correction-proposal-curation.png`

## Full gate

```sh
bun test
bun run verify:v0
```
