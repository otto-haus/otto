# 084 — Otto Cloud Phase 2: D1 Records API

Owner: Cursor
Priority: P2
Depends on: 083
Release bucket: otto cloud

## Outcome

Otto Cloud stores and serves **receipts** and **curation proposals** from D1 + R2 — otto authority records, not Letta memory.

## Scope

- D1 schema per `docs/v1/otto-web-spec.md`
- Workers routes: list/get receipts, list proposals, decide proposal (same rules as desktop `ProposalStore`)
- R2 artifact upload for receipt attachments
- Optional: desktop push endpoint `POST /api/sync/receipts` (auth token)

## Non-goals

- Letta schedule/env proxy (085)
- Bi-directional canon merge

## Done when

- [ ] One receipt visible on web after desktop push or seed script
- [ ] Proposal decide from web respects adapter seam
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
