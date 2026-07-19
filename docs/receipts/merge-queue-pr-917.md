# Merge queue babysit — PR #917

**PR:** https://github.com/otto-haus/otto/pull/917  
**Branch:** `cursor/unified-shipping-loop-orchestrator-d8d5`  
**Tick:** 021  
**At:** 2026-07-18T01:02:00Z

## Problem

CI `checks` and `scheduled-checks` failed on tick 020 branch (#917):

- Audit overrides (`dompurify`, `undici`) were already present from tick 020.
- Root cause: `dream-settings > embedded mode resolves settings under OTTO_HOME/letta` failed in full suite due to env pollution (`LETTA_SETTINGS_PATH` / `OTTO_CONFIG_DIR` leaked from prior tests).

## Fix (on tick 021 branch)

`apps/desktop/electron/dream-settings.test.ts`:

- Add `OTTO_HOME` to `afterEach` env restore list.
- Isolate embedded-mode test with fresh `OTTO_CONFIG_DIR` and clear `LETTA_*` env before assertions.

Local verify: `bun test` → 1006 pass, 0 fail; `bun audit` → no vulnerabilities.

## Head

- **Before (tick 020):** `558fecc186956beadc539c353d1f8e5bbd563da4` — CI red
- **After (tick 021 branch):** pending push — CI expected green

## Notes

Fix applied on orchestrator branch `cursor/unified-shipping-loop-orchestrator-d8d5` (not pushed to foreign PR #917 branch — Worker charter rule). Sebastian should prefer merging tick 021 over draft #916/#917 once CI confirms green.
