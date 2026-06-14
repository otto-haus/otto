# Otto Parallel Map

Throughput principle: maximize **accepted** tickets per unit time. Parallelize independent chains; preserve isolated worktrees and independent review gates.

Updated: 2026-06-14 (audit reopen: `_Done/` 62, root 35 numbered, `_Parked/` 29)

## Staging runtime (all lanes)

```txt
Live (never touch):     /Applications/otto.app
Staging smoke:          /Users/seb/.codex/admin/otto-staging/otto-staging.app
Staging launcher:       /Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
Staging deploy target:  /Applications/otto-staging.app
Deploy script:          apps/desktop/scripts/deploy-staging.sh
```

All runtime/UI proof uses staging with isolated HOME/OTTO_HOME. Do not close live Otto.

## Current state

```txt
_Done:     62 tickets — foundation 001–018, craft 026–032, bug 033–038, proven integration subset, culture 131/133, spec-only, onboarding subset, …
_InReview: (empty)
Root:      29 reopened + 136–141 (Ship/Labs) + 142 (ceremony) — sorted list in 000-index.md
_Parked:   019–025, 077, 083–099, 117–118, 120, 130
Audit:     planning/hq-tickets/000-audit-status.md (131 files scanned; 29 reopened 2026-06-14)
Canonical: git `planning/hq-tickets/` — rsync one-way to Dropbox HQ/Otto Tickets after each wave
```

## Post-audit execution waves (reopened + active)

Lowest safe parallel waves after reopen. Tickets still in `_Done/` are omitted.

| Wave | Tickets | Notes |
|------|---------|-------|
| A | 069, 071, 073, 046, 067 | Onboarding + threads (`046` reopened) |
| B | 076 → 039 → 060 | Embedded Letta → WS transport → worker loop |
| C | 041 → 042 → 043 → 044 | Cognee chain (all reopened) |
| D | 068, 047 | pgvector + memory observatory (`068`, `047` in `_Done/` — wave when unparked from proven set) |
| E | 132, 134, 135 | Culture CI UX (`132` reopened; 134/135 remain `_Done/` until re-audit) |
| F | 063 → 142 → 064, 065, 115, 141 | Release + marketing (`141` = apex/Lighthouse when unblocked) |
| Parallel head | 136–141 | Ship/Labs/Cut — Composer 2.5 Fast implementer per 136–141 table below |

Root queue sort (numeric): 039, 041–046, 049, 051–056, 058, 060–062, 066, 070, 076, 121–128, 132, 136–142.

## Functional ship loop (136–141)

```txt
Ship rule:  works OR Coming soon (Labs off) OR Labs unlock
136 audit → 137 gate → 138 Ship proof → 139 Labs UX → 141 parity → 140 release
```

**Implementer model (136–141 only):** `Composer 2.5 Fast` — mandatory for all implementation in this wave. Do not dispatch Codex/Claude/other models as implementers. Independent reviewers stay unbiased (any lane).

| Ticket | Owner | Model | Depends | Notes |
|--------|-------|-------|---------|-------|
| 136 | Codex | Composer 2.5 Fast | none | Tier matrix + Sebastian sign-off |
| 137 | Cursor | Composer 2.5 Fast | 136 | `labs` config, IPC, Settings, nav tiers |
| 138 | Codex+Cursor | Composer 2.5 Fast | 136, 076, 137 | Embedded bootstrap + 135 + Ship smokes |
| 139 | Claude | Composer 2.5 Fast | 137, 136 | ComingSoonShell + LabsBlockedShell |
| 141 | Cursor | Composer 2.5 Fast | 137 | Agent-native IPC parity |
| 140 | Cursor+Claude | Composer 2.5 Fast | 136–139, 063 | README + RELEASE_CHECKLIST; NOT PUSHED |

## Category wedge loop

```txt
123 Correct this → 048 propose → Curation accept → 126 Behavior updated → 132 compile check → 133 enforce → 134 block UX → 135 demo
124 receipt · 121 changelog · 122 constitution · 125 export · 128 gates memory · 127 on 059
```

## Culture CI loop (131–135)

```txt
131 contract → 132 compile on ratify → 133 runtime (no-fake-done + one-way-door) → 134 UI → 135 30s demo
Category: Letta = memory · Paperclip = management · Otto = behavior CI
```

## Wave 1 — Bug fix (parallel-safe)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 033 | Claude | none | Responsive resize |
| 034 | Codex | none | Charter AC gate |
| 035 | Cursor | none | Orchestrate without re-compile |
| 036 | Claude | none | Curation deferred filter (may be fixed) |
| 037 | Claude | none | Skipped loader reasons |
| 038 | Cursor | none | readiness.json sync |

## Wave 1b — Onboarding polish (parallel after 033)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 069 | Claude | none | Welcome always first on fresh profile |
| 070 | Cursor | 069 | Step vs stale chat localStorage |
| 071 | Claude | 005, 032 | Step 4 + sample receipt |
| 072 | Claude | 069, 071 partial | Receipts CTA path |
| 073 | Claude | 069, 033 | Dock UX + Settings reset |
| 080 | Claude | 076, 069–073 | Onboarding one-app narrative |
| 081 | Claude | 033, 045 | Chat shell craft polish |

069 first; 070–073 can parallelize with care on `Onboarding.tsx`. **080** after **076**.

## Wave 2 — Behavior loop (Chat trust)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 045 | Cursor | 002, 003 | Permission modal + abort fix — **P0** |
| 046 | Claude | 002, 003 | Multi-thread list — **P0 ship blocker** |
| 047 | Cursor | 001, 002, **076** | Memory observatory |
| 048 | Cursor | 014, 016, 002 | Propose from correction (mechanical) |
| 123 | Claude | 048, 002, 014 | **Correction Button** — product loop |
| 126 | Claude | 048, 123, 016 | **Ratification moment** — Behavior updated |
| 128 | Codex | 048, 016, 122 | Memory writeback gate UI |

## Wave 3 — Integration hygiene

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 054 | Cursor | 033–038 | Commit + split PRs |
| 055 | Cursor | 054, 017 | Knowledge baseline ship |
| 056 | Cursor | 054, 055 | Skills/Tickets/Channels/Workers ship |
| 129 | Cursor | 054, 063 | CI verify on main — after **054** |

## Wave 4 — Compound behavior

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 049 | Cursor | 035, 048 | Chat ticket commands |
| 050 | Codex+Claude | 009 | Precedent conflict path |
| 051 | Codex | 004, 035, 050 | No Fake Done review gate |
| 052 | Cursor | 012, 013 | Routine manual executor |
| 053 | Cursor | 010, 011, 052 | Practice runtime |

## Wave 5 — Runtime substrate + cathedral

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 076 | Codex | 033–038 | **P0** Embedded Letta one-app |
| 078 | Claude | 076 | Provider mirror — write-only BYOK |
| 079 | Codex | 076, 039 | Runtime transport mode matrix doc |
| 039 | Codex | 033–038, **076** | WS/BYOR transport |
| 058 | Cursor | 045, 039 | Craft P1 robustness |
| 119 | Claude | 076, 080 | Primary agent default UX |

## Wave 6 — Cognee under Knowledge

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 040 | Codex | 018, 033–038 | Contract + seam |
| 041 | Cursor | 040 | Local home |
| 042 | Cursor | 041 | MCP recall |
| 043 | Cursor | 041, 016 | Capture canon |
| 044 | Claude | 042, 043 | Knowledge graph UI |
| 068 | Codex | 040, 055 | pgvector local recall (optional) |

## Wave 7 — Desktop polish + autonomy depth

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 057 | Claude | 030, 056 | Distinct system icons (Launch Polish) |
| 059 | Claude | 049, 056, 045 | Command station dashboard shell |
| 127 | Claude | 059, 121, 122, 124 | Culture home cards on **059** |
| 060 | Codex | 049, 051, 039 | Worker autonomous loop |
| 061 | Codex | 053, 016, 052 | Practice mining observe |
| 062 | Cursor | 055, 052 | AI Frontier review executor |
| 066 | Cursor | 056, 041 | Skills library seed |

## Wave 7b — Culture wedge

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 122 | Codex | 008, 009, 017 | Constitution — culture source file |
| 124 | Claude | 045, 059 | Receipts first-class UI |
| 121 | Claude | 048, 051, 126 | Behavior Changelog |
| 125 | Codex | 122, 124 | Culture export bundle |

## Wave 7c — Culture CI (Checks)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 131 | Codex | 008, 009, 016 | Check contract + `docs/v1/checks.md` — **P0 thesis** |
| 132 | Codex | 131, 048, 126 | Compile Standard → Check on ratification |
| 133 | Codex | 131, 132, 051, 045 | Check runtime + No Fake Done + One-Way Door; `checks.list`/`checks.get` |
| 134 | Claude | 131, 133, 124 | Checks surface + block UX — after **133** IPC |
| 135 | Claude | 123–126, 132–134 | 30s demo runbook — **primary launch proof** |

**131** can start after **016**; **132** after **126** accept path stable; **133** unblocks **135**; **134** parallel with **133** once IPC list exists.

## Wave 8 — Release + public surface

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 063 | Cursor+Claude | 033–038, 045, 048, 051, 054–056 | Release lane — Sebastian gate |
| 064 | Claude | 063, 033, 057 | Remotion/demo refresh |
| 065 | Claude | 063 | Marketing site otto.haus |
| 115 | Claude | 063 | `/pricing` managed pilot |
| 116 | Codex | 115 | Pilot claim boundary |

## Wave 9 — Otto Cloud (parallel to desktop after 076)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 082 | Codex | 018 | Architecture spec |
| 083 | Claude | 082, 065 | Pages shell — parked |
| 084 | Cursor | 083 | D1 records — parked |
| 085 | Codex | 084, 079 | Letta read — parked |
| 086 | Cursor | 085 | VM template — parked |
| 087 | Cursor | 084, 056 | Discord webhooks — parked |
| 088 | Codex | 087 | WorkOS — parked |

## Wave 9b — Ops clarity (parallel)

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 091 | Cursor | none | Live vs staging runbook — **P1** |

## Wave 10 — Cathedral control plane

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 092 | Codex | 017, 051, 082 | Umbrella spec |
| 093 | Codex | 076, 092 | Multi-agent ADR — parked |
| 094–099 | mixed | 092+ | Implementation — parked |

## Unpark queue (from `_Parked/`)

| Ticket | Unpark after |
|--------|----------------|
| 019 Intake | 048 |
| 020 Discord | 045, 048, 056 |
| 021 Paperclip read | 048, 051 |
| 074 Paperclip intake | 021, 056 |
| 022 Paperclip task create | 021, 049, 051 |
| 075 Paperclip status | 022, 051 |
| 077 Letta Cloud remote | 076, 039 |
| 083 Otto Cloud Pages | 082 reviewed, 065 |
| 084 D1 records | 083 |
| 085 Letta read proxy | 084, 079 |
| 086 Remote env VM | 085 |
| 087 Discord (cloud) | 084, 056 |
| 088 WorkOS | 087 |
| 089 Sync contract | 082 reviewed, 084 |
| 090 Monorepo ADR | 082 reviewed |
| 093 Multi-agent ADR | 092 reviewed |
| 094 Command queue | 092, 084 |
| 095 Leases | 094 |
| 096 Audit export | 092, 084 |
| 097 Heartbeat | 092, 085/086 |
| 098 Replay | 094, 095 |
| 099 Notifications | 092, 020/087 |
| 117 Pilot intake | 115, 116 |
| 118 Culture vs memory | optional after 115 |
| 120 Isolated second agent | 119, 093 +1 |
| 130 Extension CLI parity | 053, 076 stable |
| 023 Stacks | 019, 040 |
| 024 People packs | 044, 023 |
| 025 Pinned chat | **cancelled → 046** |

## File / domain conflicts

| Boundary | Tickets | Rule |
|---|---|---|
| Electron/runtime | 039, 045, 058, **076** | Codex owns 076+039 |
| Chat.tsx / shell | 033, 045, 046, 048, 123, 049, 069–073, **081** | Serialize onboarding edits |
| Curation accept UX | 126, 128, 016 | Claude UI + Codex gate logic |
| Panes.tsx | 037, 044, 055, 056, 057, 059, 127, 121, 124, **134** | Claude UI — avoid parallel edits |
| proposal-store | 048, 128, 050, 051, 021, **132** | Codex review for gate + compile logic |
| check-* (compiler, runner) | **131–133** | Codex owns runtime; IPC `checks.*`; no renderer bypass |
| `.github/workflows/` | 129 | Cursor only |
| extension/ | 130 | Parked; after 053 |

## Recommended execution order (single lane)

```txt
**136 → 137 → 138 → 139 → 141 → 140**
(historical integration 033–135 assumed in tree; 138 re-proves Ship tier on staging)
→ unpark Cloud/Paperclip/Discord only after 140 + explicit Sebastian unpark
```

## Functional ship vs Cathedral

```txt
Functional ship (136–141):  Ship tier works (Labs off) + Labs tier honest (Coming soon / unlock)
Cathedral / Cloud:          Cut from default UI — parked 083–099, 094–099
```

## Recompute trigger

Refresh after any `_Done` move, `_InReview` move, review -1, unpark, or shared-file conflict.
