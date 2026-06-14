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

**Current head:** **033–038** → **076** → **045–048** + **123** + **126** → **054–056** → **122**/**124**/**128** → **131–135 Culture CI** → **063** → wedge **121**/**125**/**127**; **129** after **054**; **130** parked.

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
| 123 | Correction Button (product loop) | Claude | 048, 002, 014 | Correct this → Curation |
| 126 | Ratification moment | Claude | 048, 123, 016, 051 | Behavior updated on accept |
| 128 | Memory writeback gate UI | Codex | 048, 016, 047, 122 | no silent memory apply |
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
| 115 | Marketing: `/pricing` pilot page | Claude | 063 | managed pilot, not SaaS |
| 116 | Pilot offer claim boundary | Codex | 115 | forbidden claims doc |
| 117 | Pilot intake flow | Claude | 115, 116 | `_Parked/` |
| 118 | Culture vs memory page | Claude | 115 | `_Parked/` optional |
| 119 | Primary agent default UX | Claude | 076, 080 | one agent; no fleet UI |
| 129 | CI verify gate on main | Cursor | 054, 063 | AGENTS.md suite on PR |

### Category wedge — culture compounding

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 121 | Behavior Changelog (weekly digest) | Claude | 048, 051, 016 | ratified changes visible |
| 122 | Constitution file (source of culture) | Codex | 008, 009, 017 | plain file + validator |
| 124 | Receipts first-class UI | Claude | 004, 005, 045, 059 | authority + proof, not logs |
| 125 | Agent culture export (portable bundle) | Codex | 122, 051, 008, 124 | zip manifest; no secrets |
| 127 | Command Station culture home | Claude | 059, 121, 122, 124 | culture cards on **059** |

```txt
123 → 048 → accept → 126 → 132 compile → 133 enforce → 134 UX → 135 demo
124 receipt · 121 changelog · 122 constitution · 125 export · 128 gates memory · 127 on 059
```

### Checks wedge — Culture CI (category thesis)

**Naming (locked):** product primitive **Checks** (UI, `checks.*` IPC, `~/.otto/checks/`, `otto.check.v1`); category **Culture CI** in README/marketing prose only. **Practices** = behavior specs; **Checks** = executable regressions from ratified **Standards**.

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 131 | Check contract (`otto.check.v1`) | Codex | 008, 009, 016 | schema + `docs/v1/checks.md` |
| 132 | Compile Standard → Check | Codex | 131, 048, 126 | Check on ratification |
| 133 | Runtime + seed Checks (No Fake Done, One-Way Door) | Codex | 131, 132, 051, 045 | block + Receipt |
| 134 | Checks surface + block UX | Claude | 131, 133, 124 | staging block visible |
| 135 | No Fake Done demo: 30s vertical slice | Claude | 123–126, 132–134 | runbook + capture |

```txt
Culture is a test suite.
Ratified rule → executable Check → blocked or allowed → Receipt
```

Extends **051** (No Fake Done) into general **Check** runtime. Primary launch demo (**135**) over Remotion-only polish.

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
| 089 | Desktop ↔ Cloud sync contract | Codex | 082, 084 | `_Parked/` — after 084 stub |
| 090 | Cloud monorepo layout ADR | Codex | 082 | `_Parked/` — before 083 |
| 091 | Live vs staging deploy runbook | Cursor | none | operator runbook — P1 now |

### Cathedral / always-on control plane

| # | Ticket | Owner | Depends on | Proof |
|---:|---|---|---|---|
| 092 | Agent Control Plane / Always-On (spec) | Codex | 017, 051, 082 | `docs/v1/agent-control-plane-spec.md` + +1 |
| 093 | Multi-agent workspace policy ADR | Codex | 076, 092 | `_Parked/` — one primary default |
| 094 | Command queue contract | Codex | 092, 084 | `_Parked/` |
| 095 | Execution leases | Codex | 094, 060 | `_Parked/` |
| 096 | Audit export bundle | Cursor | 092, 084 | `_Parked/` |
| 097 | Runner heartbeat | Cursor | 092, 086, 085 | `_Parked/` |
| 098 | Replay & recovery | Codex | 094, 095, 039 | `_Parked/` |
| 099 | Notification policy | Claude | 092, 020, 087 | `_Parked/` |

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
089 Desktop ↔ Cloud sync contract — unpark after 082 reviewed, 084 D1 stub
090 Cloud monorepo layout ADR — unpark after 082 reviewed (before 083)
093 Multi-agent policy ADR — unpark after 092 reviewed
094 Command queue — unpark after 092, 084
095 Execution leases — unpark after 094
096 Audit export — unpark after 092, 084
097 Runner heartbeat — unpark after 092, 086/085
098 Replay/recovery — unpark after 094, 095
099 Notification policy — unpark after 092, 020/087
117 Pilot intake — unpark after 115, 116
118 Culture vs memory — optional after 115
120 Isolated second agent — unpark after 119, 093 +1
130 Extension CLI parity — unpark after 053, 076 stable
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
057 System nav icons        — Claude (done — review pending)
064 Remotion refresh        — Claude (queued)
065 Marketing site          — Claude (queued)
115 Pricing pilot page      — Claude (after 063)
116 Pilot claim boundary    — Codex (with 115)
121–128 Culture wedge       — see Category wedge section
131–135 Checks wedge          — Culture CI positioning; see plan Category and naming (locked)
129 CI verify on main       — Cursor (after 054)
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
