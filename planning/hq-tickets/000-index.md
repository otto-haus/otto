# Otto Tickets

One folder. One queue. One ticket per capability.

See `000-canonical.md` for the canonical operating contract. Agents should start with `AGENTS.md`.
Use `000-parallel-map.md` as the live dependency/throughput map before launching parallel work.

## Status is folder location

```txt
root       = active queue; implementer may build
_InReview  = built; waiting for independent review
_Done      = finished, proven, reviewer +1
_Parked    = valid future work; do not touch unless explicitly unparked
```

Do not rely on vibes. A ticket moves to `_Done` only after every `Done when` item is proven and reviewer gives `+1`.

## Proof lives in the ticket

The ticket is the canonical proof — every `Done when` item maps to evidence inside the ticket.
`receipts/` holds only raw logs (e.g. boot proofs) **referenced by** a ticket, never a second
source of truth.


## Owner routing

```txt
Codex  = real reasoning: contracts, schemas, gates, invariants, proof logic, authority decisions
Claude = writing/UI/UX/craft: copy, docs, motion, visual polish, language-heavy surfaces
Cursor = default executor: straightforward implementation, plumbing, integrations, mechanical edits, test/build fixes
```

Default to Cursor unless the hardest irreducible part is Codex-grade reasoning or Claude-grade craft.

## Active queue

**Current head (2026-06-14 · loop tick 12):** wave 5 complete — `018` in `_Done`. Active queue empty; unpark `019+` when ready.

Work the lowest-numbered dependency-safe wave in root.

Exception: dependency-free craft tickets may run out of order **only when explicitly labeled
`Launch Polish`**. Core behavior tickets remain ordered by dependency.

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 001 | Settings: Letta Readiness | Cursor | none | valid/invalid/missing config states |
| 002 | Chat: Real Adapter Path | Cursor | 001 | message uses real Letta path |
| 003 | Chat: Empty/Error/Loading States | Claude | 001, 002 | no fake connected/sample state |
| 004 | Receipt Contract | Codex | 001, 002 | success + blocked receipt examples |
| 005 | Receipts Surface | Claude | 004 | list/detail receipts visible |
| 006 | Charter Contract | Codex | 004 | charter links to run/receipt |
| 007 | Charters Surface | Claude | 006 | create/view/update charter |
| 008 | Standards: File-Backed Canon | Codex | 004 ✓ | `_Done` — file loader + receipt citations |
| 009 | Standards Surface | Claude | 008 ✓ | `_Done` — list/detail + receipt citations |
| 010 | Practices Contract | Codex | 008 ✓ | `_Done` — file loader + receipt practice ref |
| 011 | Practices Surface | Claude | 010 ✓ | `_Done` — live practices UI + curation gate |
| 012 | Routines Contract | Codex | 010 ✓ | `_Done` — RoutineStore + manual run receipt |
| 013 | Routines Surface | Claude | 012 ✓ | `_Done` — list/detail/manual run UI |
| 014 | Curation: Proposal Contract | Codex | 004, 008, 010 ✓ | `_Done` — proposal store + no silent canon mutation |
| 015 | Curation Inbox | Claude | 014 ✓ | `_Done` — proposals inbox UI + pending/decided filters |
| 016 | Curation Decisions | Codex | 015 ✓ | `_Done` — accept/reject/defer + canon apply path |
| 017 | Autonomy Policy | Codex | 016 ✓ | `_Done` — policy.yaml + gates + decision receipts |
| 018 | Next-Layer Readiness Gate | Codex | 001-017 ✓ | `_Done` — adapter boundary safe |

## Parked queue

Tickets in `_Parked` are valid, but not active. They become active only by moving them back to root.

Currently parked:

```txt
019 Intake: Manual Import — Codex
020 Discord Approval Bridge — Cursor
021 Paperclip Readonly Import — Cursor
022 Paperclip Task Creation — Cursor
023 Stacks Source Packets — Codex
024 People Context Packs — Claude
025 Pinned Chat List — Claude
```

## Craft tickets (Launch Polish — all Claude)

```txt
026 Icon set                — Claude (done)
027 Motion spec §09         — Claude (done)
028 Onboarding design       — Claude (done)
029 Collapsed sidebar fix   — Claude (done)
030 Wire approved icons     — Claude (done)
031 Sidebar logo alignment  — Claude (done)
032 Onboarding first-run    — Claude (done)
```

Owner = task nature (real reasoning → Codex; writing/UI/UX/craft → Claude; straightforward implementation/plumbing → Cursor). Lane note: 001 and 002 were executed by Claude/Codex during launch but are Cursor-nature under the new routing; their receipts record the actual executor.

## Operating loop

```txt
real action → receipt → proposal/learning → curation → changed future behavior
```

## Handoff rule

Do not unpark `019+` until `018-next-layer-readiness-gate.md` moves through `_InReview` and lands in `_Done`.


## Workflow files

```txt
000-parallel-map.md            dependency DAG, waves, conflicts, parallel rules
_template.md                 ticket template
_workflow-run-ticket.md      implement one ticket, write receipt, stop
_workflow-review-ticket.md   independent review, append verdict
```
