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

**Current head (2026-06-14):** **033–038** bug wave → **076** embedded Letta → **045–048** + **081** Chat → **054–056** → compound through **066**; **082** otto cloud spec (done when reviewed); **083–088** parked; adapters **021–022/074–075** parked. Full DAG: `000-parallel-map.md`.

Work the lowest-numbered dependency-safe wave in root.

Exception: dependency-free craft tickets may run out of order **only when explicitly labeled
`Launch Polish`**. Core behavior tickets remain ordered by dependency.

### Done (001–018, 026–032)

See `_Done/` folder. Craft 026–032 complete.

### Bug wave 6

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 033 | Bug: Desktop responsive resize | Claude | none | staging resize smoke |
| 034 | Bug: Charter complete AC gate | Codex | none | store test blocks fake complete |
| 035 | Bug: Ticket orchestrate existing | Cursor | none | orchestrate without re-compile |
| 036 | Bug: Curation deferred filter | Claude | none | deferred in decided filter |
| 037 | Bug: Skipped loader reasons visible | Claude | none | skipped list on Behavior panes |
| 038 | Bug: Readiness.json stale | Cursor | none | Settings matches wired surfaces |

### Onboarding polish (post-032 audit)

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 069 | Bug: Welcome skipped when already connected | Claude | none | welcome on fresh profile even if ready |
| 070 | Bug: Step confused by stale chat messages | Cursor | 069 | step machine ignores old localStorage chat |
| 071 | Bug: Missing step 4 + sample Receipt | Claude | 005, 032 | 028 journey complete; no "coming soon" |
| 072 | Bug: Receipts CTA shows Connect dock | Claude | 069 | secondary path = receipt education |
| 073 | Bug: Connect dock UX gaps | Claude | 069, 033 | live reason, auto-done, narrow layout, reset |
| 080 | Onboarding: One-App Zero-Setup | Claude | 076, 069–073 | no “install Letta”; embedded-first copy |
| 081 | Chat Shell: Product Craft Polish | Claude | 033, 045 | remove dev chrome; staging = craft spec |

### Runtime + Cognee

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| **076** | **Embedded Letta / One-App Distribution** | Codex | 033-038 | **P0** — no Letta.app install; Chat on fresh Mac |
| 039 | Cathedral: WebSocket Runtime Transport | Codex | 033-038, **076** | WS/BYOR transport + promotion gate |
| 079 | Runtime Transport Mode Matrix (doc) | Codex | 076, 039 | `docs/runtime-transport.md`; no silent Cloud fallback |
| 078 | Provider Capability Mirror (Settings) | Claude | 076 | write-only BYOK; otto not secret SoR |
| 077 | Letta Cloud / Remote Mode (parked) | Codex | 076, 039 | `_Parked/` — advanced opt-in only |
| 040 | Cognee: Contract & Adapter Seam | Codex | 018, 033-038 | docs + types; Cognee under Knowledge |
| 041 | Cognee: Local Home (Self-Host) | Cursor | 040 | loopback health + skill + scripts |
| 042 | Cognee: MCP Recall Bridge | Cursor | 041 | read-first MCP + autonomy gates |
| 043 | Cognee: Capture Otto Canon | Cursor | 041, 016 | provenance capture + receipts |
| 044 | Cognee: Knowledge Graph Surface | Claude | 042, 043 | thin Knowledge pane section |

### Behavior loop (Chat + culture)

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 045 | Chat: Permission Modal + Abort Fix | Cursor | 002, 003 | no deadlock; busy clears |
| 046 | Chat: Multi-Thread List + Switcher | Claude | 002, 003 | **P0 ship blocker** — sidebar thread list |
| 047 | Letta Memory Observatory (read-only) | Cursor | 001, 002, **076** | blocks + search; Open in Letta |
| 048 | Chat: Propose from Correction | Cursor | 014, 016, 002 | proposal in Curation |
| 049 | Chat: Ticket Orchestration Commands | Cursor | 035, 048 | compile/orchestrate from Chat |
| 050 | Standards: Precedent Conflict Path | Codex+Claude | 009 | precedent surfaced on conflict |
| 051 | Automated Review Gate (No Fake Done) | Codex | 004, 035, 050 | done blocked without +1 |
| 052 | Routine Manual Executor + Receipt | Cursor | 012, 013 | trial run receipt |
| 053 | Practice Runtime (Charter/Review/Field Note) | Cursor | 010, 011, 052 | invocation receipts |

### Integration + system surfaces

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 054 | Repo Hygiene: Commit & Split PRs | Cursor | 033-038 | PR stack ready |
| 055 | Knowledge Baseline Ship | Cursor | 054, 017 | ship check evidence |
| 056 | System Surfaces Ship (Skills/Tickets/Channels) | Cursor | 054, 055 | per-surface smoke |
| 057 | System Nav Distinct Icons | Claude | 030, 056 | Launch Polish |
| 058 | Craft: Runtime Robustness Pack | Cursor | 045, 039 | punchlist P1 |
| 059 | Command Station Dashboard (Thin) | Claude | 049, 056, 045 | unified status cards |

### Autonomy + knowledge depth

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 060 | Worker Autonomous Runtime Loop | Codex | 049, 051, 039 | bounded worker run |
| 061 | Practice Mining Observe Loop | Codex | 053, 016, 052 | observe → proposal |
| 062 | AI Frontier Review Routine Executor | Cursor | 055, 052 | knowledge update receipt |
| 066 | Skills Capability Library Seed | Cursor | 056, 041 | ≥5 skill stubs |
| 067 | One-pagers Surface Alignment | Claude | none | Launch Polish; surface test footers |
| 068 | pgvector Local Recall Store | Codex | 040, 055 | optional Postgres+pgvector semantic recall |

### Release + marketing

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 063 | Release Lane v0.1 (Sebastian Gate) | Cursor+Claude | 033-038, 045, 048, 051, 054-056 | checklist honest; no push |
| 064 | Remotion + Demo Asset Refresh | Claude | 063, 033, 057 | demo/out updated |
| 065 | Marketing Site: otto.haus | Claude | 063 | static site + brand guide |

### Otto Cloud (web control plane)

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 082 | Otto Cloud: Architecture Spec | Codex | 018 | `docs/v1/otto-web-spec.md` + reviewer +1 |
| 083 | CF Pages shell + health | Claude | 082, 065 | `_Parked/` — app subdomain live |
| 084 | D1 receipts/proposals API | Cursor | 083 | `_Parked/` |
| 085 | Letta Cloud read (envs/schedules) | Codex | 084, 079 | `_Parked/` |
| 086 | Remote env VM template | Cursor | 085 | `_Parked/` — `otto-cloud` env |
| 087 | Discord webhooks on Workers | Cursor | 084, 056 | `_Parked/` — extends 020 |
| 088 | WorkOS orgs | Codex | 087 | `_Parked/` — multi-user later |

## Parked queue

Tickets in `_Parked/` are valid, but not active. They become active only by moving them back to root when unpark conditions in `000-parallel-map.md` are met.

```txt
019 Intake: Manual Import — unpark after 048
020 Discord Approval Bridge — unpark after 045, 048, 056
021 Paperclip Read-Only Import — unpark after 048, 051 (approval door to connect)
022 Paperclip Task Creation — unpark after 021, 049, 051 (every write = approval + receipt)
074 Paperclip Intake Surface — unpark after 021, 056
075 Paperclip Status Feedback — unpark after 022, 051 (complete ≠ Done)
077 Letta Cloud Remote Mode — unpark after 076, 039 (advanced only)
083 Otto Cloud Pages shell — unpark after 082 reviewed, 065 subdomain
084 D1 records API — unpark after 083
085 Letta Cloud read proxy — unpark after 084, 079
086 Remote env VM — unpark after 085
087 Discord webhooks (cloud) — unpark after 084, 056
088 WorkOS orgs — unpark after 087 (multi-user)
023 Stacks Source Packets — unpark after 019, 040
024 People Context Packs — unpark after 044, 023
025 Pinned Chat List — SUPERSEDED by 046 (reference only)
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
057 System nav icons        — Claude (queued)
064 Remotion refresh        — Claude (queued)
065 Marketing site          — Claude (queued)
067 One-pagers alignment    — Claude (InReview — staging smoke pending)
```

Owner = task nature (real reasoning → Codex; writing/UI/UX/craft → Claude; straightforward implementation/plumbing → Cursor). Lane note: 001 and 002 were executed by Claude/Codex during launch but are Cursor-nature under the new routing; their receipts record the actual executor.

## Operating loop

```txt
real action → receipt → proposal/learning → curation → changed future behavior
```

## Handoff rule

018 is `_Done`. Unpark 019–024 only per `000-parallel-map.md` unpark table.

## Workflow files

```txt
000-parallel-map.md            dependency DAG, waves, conflicts, parallel rules
_template.md                 ticket template
_workflow-run-ticket.md      implement one ticket, write receipt, stop
_workflow-review-ticket.md   independent review, append verdict
```
