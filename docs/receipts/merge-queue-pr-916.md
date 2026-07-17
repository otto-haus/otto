# Merge queue babysit — PR #916

**PR:** https://github.com/otto-haus/otto/pull/916  
**Branch:** `cursor/unified-shipping-loop-orchestrator-783d`  
**Tick:** 020  
**At:** 2026-07-17T01:02:00Z

## Problem

CI `checks` job failed on dependency audit:

- `dompurify <=3.4.10` (moderate, via streamdown)
- `undici >=7.23.0 <7.28.0` (multiple severities, via electron toolchain)

Tick 019 PR was docs-only and omitted the audit overrides that ticks 015–018 carried in `package.json`.

## Fix (on tick 020 branch)

Root `package.json` overrides:

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Regenerated `bun.lock`. Local verify: `bun audit` → no vulnerabilities.

## Head

- **Before (tick 019):** `fb58c49c4650828cbc339497a3705b92371f4149` — CI red
- **After (tick 020 branch):** pending push on `cursor/unified-shipping-loop-orchestrator-4487`

## Notes

Fix applied on orchestrator tick 020 branch rather than pushing to #916 (foreign PR branch requires Worker charter). Sebastian should prefer merging tick 020 over #916.
