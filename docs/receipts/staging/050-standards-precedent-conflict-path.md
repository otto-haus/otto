# Staging receipt — 050 Precedent conflict path

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Unit verification

```sh
bun test ./apps/desktop/electron/standard-store.test.ts
```

## Staging capture (rev9)

**Manifest:** `staging-rev8-proof-20260614070035.json`

- Opened `candor-kindness` **detail** (not list-only)
- `conflictBannerVisible: true` — **CONFLICT · CASE LAW** banner + precedent excerpt
- Precedent: `precedents/2026-06-13-candor-vs-kindness.md`

**Screenshot:** `050-precedent-conflict-banner.png`

## Full gate

```sh
bun test
bun run verify:v0
```
