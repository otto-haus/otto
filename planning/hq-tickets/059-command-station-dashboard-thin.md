# 059 — Command Station Dashboard (Thin)

Owner: Claude
Priority: P2
Depends on: 049, 056, 045
Release bucket: v0.1 desktop

## Outcome

One **thin dashboard** answers: what Otto is managing, what needs Sebastian, what was proven — without a generic SaaS wall.

## Why this matters

Desktop one-pager test Partial: panes exist separately; no unified command view.

## Scope

- Home or Chat-adjacent dashboard card row:
  - open tickets / workers active
  - pending Curation proposals
  - recent receipts (3)
  - doors awaiting approval (permission + curation)
- All data from real stores — empty states honest
- No charts, no fake KPIs

## Out of scope

- Full analytics
- Mobile layout

## Done when

- Staging dashboard reflects live store counts
- Zero pending → empty copy, not zeros fabricated
- Screenshot in receipt
- Links drill to Tickets/Curation/Receipts panes

## Relationship to **127**

**059** ships the ops dashboard shell. **127** adds culture-home cards (Constitution, Changelog, latest proof). Both may land in one PR; **127** tracks culture-home acceptance.

## Verification

```sh
bun run --cwd apps/desktop typecheck
apps/desktop/scripts/deploy-staging.sh
```

## Blocker log

Leave blank unless blocked.
