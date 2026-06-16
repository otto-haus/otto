# T021 — #577 OttoProductDemo render + staging @ 47006733

**Date:** 2026-06-16  
**Authority:** PR master (merge if green)  
**Base:** `origin/main` @ `47006733` (#876 #512)

## Scout

| Field | Value |
|-------|-------|
| Open PRs | 0 |
| Skipped | #571 (PRs #436–#446 already closed/merged — proof-close only) · #730/#731 epics |
| Selected | **#577** p2 · demo/ disjoint |
| Branch | `fix/577-otto-product-demo-render` |
| Worktree | `/Users/seb/Code/otto/.worktrees/issue-577` |

## Staging rebuild

| Field | Value |
|-------|-------|
| Command | `task staging:build` @ issue-580 worktree |
| Result | **PASS** |
| build_marker | `47006733` |
| build_time | `2026-06-16T11:33:34Z` |

## Implementation (#577)

**Change:** smoke-frame script, enriched render receipt (sha/duration/tier), OttoProductDemo unit test, README verify steps.

**Verify:**
- `bun test demo/src/demo-compositions.test.ts` — 2 pass
- `bash scripts/demo-smoke-frame.sh OttoProductDemo` — frame0 PNG 30169 bytes
- `bash scripts/render-demo-clips.sh OttoProductDemo` — MP4 3.1 MB, 54s @ 1620 frames
- Receipt: `receipts/otto-v01/demo-render-20260616T113507Z.md`

**#571 defer:** all megabranches #436–#446 closed/merged; close issue with comment after #577 merge.

## v0.1.7 — NOT ready (do not cut)

Same gates as T020: `verify:v0` green, CI embedded-letta live, clean-machine manual + Sebastian sign-off still required.

## Artifacts

- `/Applications/otto-staging.app` (marker `47006733`)
- `/Users/seb/Code/otto/.worktrees/issue-577`
- `/Users/seb/Code/otto/.worktrees/issue-577/demo/out/otto-product-demo.mp4` (gitignored)
- `/Users/seb/Code/otto/.worktrees/issue-577/receipts/otto-v01/demo-render-20260616T113507Z.md`
