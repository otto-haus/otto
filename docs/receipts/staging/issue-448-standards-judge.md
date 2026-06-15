# Judge receipt — Standards surface (#448)

**PR:** https://github.com/otto-haus/otto/pull/514  
**Date:** 2026-06-15 (Lead re-review after initial Judge blocked — no PR existed yet)

## Overall: +1 merge-ready (pending unrelated CI)

Worker PR addresses PM AC. CI `checks` job fails on **unrelated** permission-round-trip + runtime-common tests (8 failures, not in PR diff). Standards-specific verify passes locally.

## Per-AC

| AC | Verdict | Evidence |
|----|---------|----------|
| 1 | **PASS** | `standards` removed from `WORKSPACE_PREVIEW_SURFACES`; test `standards surface is open (#448)` |
| 2 | **PASS** | `standard-store.test.ts` 9/9; SkippedLoaderPanel + InlineEmpty |
| 3 | **PASS** | Domain on registry refs + `groupStandardsByDomain` |
| 4 | **PASS** | `standardStatusPill` maps `deprecated` → Superseded |
| 5 | **PASS** | Search + status + domain filters; no-match empty |
| 6 | **PARTIAL** | do/refuse/evidence + markdown excerpt; no dedicated examples section parser |
| 7 | **PARTIAL** | Tension map + anti-pattern chips; no precedents file browser |
| 8 | **PASS** | Ratification strip + curation path copy |
| 9 | **PASS** | typecheck + 19 targeted tests green |
| 10 | **PASS** | No mock data; no otto.app touch |

## Verify

```sh
bun run --cwd apps/desktop typecheck
bun test apps/desktop/src/standards-filter.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/electron/standard-store.test.ts
```

## Remaining (non-blocking)

- Staging smoke not run in this review
- Precedents index UI (AC7 stretch)
- Unrelated CI failures on branch
