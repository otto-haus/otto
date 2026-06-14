# Otto Tickets

Rule: ticket order is build order. Status is truth. Release labels come later.

Canonical HQ conveyor (folder status, reviews): `~/Library/CloudStorage/Dropbox/HQ/Otto Tickets`

Lane ↔ HQ mapping: `000-hq-sync.md`

## Status legend

- `todo` — not started
- `doing` — actively being built
- `blocked` — waiting on a specific blocker
- `review` — built, needs Sebastian/agent review
- `done` — accepted and complete

## Current lane — make Otto real

**Lane 001–009: done** (2026-06-13). Proof in each ticket + `000-hq-sync.md`.

| # | Ticket | Status | Depends on |
|---:|---|---|---|
| 001 | Chat Surface | done | none |
| 002 | Settings + Letta Connection | done | none |
| 003 | Receipts | done | 001, 002 |
| 004 | Charters | done | 003 |
| 005 | Standards | done | 003 |
| 006 | Practices | done | 005 |
| 007 | Routines | done | 006 |
| 008 | Curation Skeleton | done | 003, 005, 006 |
| 009 | Autonomy | done | 004, 008 |

## Next lane — make Otto compound faster

Do not build these before the readiness gate passes. **Gate 016 is done** — 010–013 are unblocked.

| # | Ticket | Status | Depends on |
|---:|---|---|---|
| 010 | Intake | todo | 008 |
| 011 | Discord Bridge | todo | 003, 008 |
| 012 | Paperclip Readonly | todo | 003 |
| 013 | Paperclip Write | todo | 008, 012 |
| 016 | Next Layer Readiness Gate | done | 001-009 |

Gate passed (HQ 018 `_Done`). Lane 010–013 may start.

## Future lane — source and relationship graph

Parked until Otto has working receipts + curation.

| # | Ticket | Status | Depends on |
|---:|---|---|---|
| 014 | Stacks Source Corpus | todo | 003 |
| 015 | People Context Packs | todo | 003 |

## Operating rule

Build the smallest next ticket that proves Otto is real:

```txt
real action → receipt → proposal/learning → curation → changed future behavior
```

## Handoff rule

When tickets `001-009` are done, run `016-next-layer-readiness-gate.md` before starting `010-013`.

The gate exists to prevent the next layer from being built on fake state, mock receipts, unclear schemas, or vague approval boundaries.
