# Issue #126 — Compile Ratified Standard → Check

**Date:** 2026-06-14  
**PR:** https://github.com/otto-haus/otto/pull/476

## Acceptance

| Criterion | Proof |
|-----------|-------|
| Accept standard proposal → check file with correct `source` | `check-compiler.test.ts` compile test |
| Re-accept bumps version; `checks.list` returns active | version 1.0.1→1.0.2 test + `CheckStore.listResult` |
| Receipt `check.compiled` with check id + standard ref | compiler + `proposal-store.test.ts` |
| Skip non-compilable → no fake check + honest receipt | `check.compile_skipped` receipt on mapping miss |
| Curation accept hook | `proposal-store.ts` → `CheckCompiler.compileFromProposal` |

## Verification

```sh
bun run typecheck
bun test apps/desktop/electron/check-compiler.test.ts apps/desktop/electron/proposal-store.test.ts
# 17 pass / 0 fail
```

## Delta (this PR)

- `check-compiler.ts`: emit `check.compile_skipped` receipt when standard has no compile mapping (closes silent-skip gap from ticket scope).
