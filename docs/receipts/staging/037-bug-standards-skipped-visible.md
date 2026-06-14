# Staging receipt — 037 Skipped loader UI

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Capture

Script seeds `practices/_staging-proof-malformed/practice.yaml` (invalid YAML), opens Practices pane, captures `SkippedLoaderPanel`, then removes fixture.

**Manifest:** `staging-rev8-proof-20260614070035.json`

## Proof

- `skippedPanelVisible: true`
- Panel shows path `_staging-proof-malformed/practice.yaml` and parse reason

**Screenshot:** `037-practices-skipped-loader.png`
