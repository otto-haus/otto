# Sebastian ratification — 2026-06-15

**Approved by:** Sebastian (chat)  
**Recorded by:** unified-loop orchestrator  
**gh automation:** could not apply — token lacks label/close/comment permissions; `status: in progress` label does not exist in repo yet

## BUILD ratified → intake unlocked (state)

| Issue | Title |
|-------|-------|
| #627 | Cloud connection mode without Labs gate |
| #628 | connectionMode IPC bypasses Labs gate |
| #630 | PreviewChat setup banner misleads web-preview |
| #631 | Receipts Correct This bridge |
| #632 | ConnectLetta connectionMode default mismatch |
| #633 | Remove API key field from Settings |
| #635 | Sidebar nav badge counts never wired |
| #636 | Practice mining observe() no trigger |
| #637 | Behavior changelog not injected into agent |
| #638 | DreamSettingsPanel fake defaults |

**Manual GitHub step:** create label `status: in progress` if missing, then apply to each issue and remove `status: build candidate` where present. Add `p2` to #630–#633 if still unlabeled.

## SHIP approved for merge

| PR | Action |
|----|--------|
| #624 | Merge (p1, green, MERGEABLE) |
| #582 | Merge (docs-only, green, MERGEABLE) |

## Close dupes approved

| PR | Superseded by |
|----|---------------|
| #588 | merged #618 |
| #596 | merged #626 |
| #587 | #624 |

## Next loop tick

Intake may spawn workers for ratified issues (priority p1→p2, file-disjoint vs open PRs #582/#624).
