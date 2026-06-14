# Otto Parallel Map

Throughput principle: maximize **accepted** tickets per unit time. Parallelize independent chains; preserve isolated worktrees and independent review gates.

Updated: 2026-06-14 (root queue 033–082; parked 019–025, 077, 083–088)

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
_Done:     001–018, 026–032
_InReview: 067 (one-pagers — staging smoke pending)
Root:      033–082 (queued)
_Parked:   019–025, 077, 083–088 (025→046; 077 after 076+039; cloud after 082+065)
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
| 046 | Claude | 002, 003 | Multi-thread list — **P0 ship blocker** (parallel with 045) |
| 047 | Cursor | 001, 002, **076** | Memory observatory — after embedded substrate |
| 048 | Cursor | 014, 016, 002 | Propose from correction |

## Wave 3 — Integration hygiene

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 054 | Cursor | 033–038 | Commit + split PRs |
| 055 | Cursor | 054, 017 | Knowledge baseline ship |
| 056 | Cursor | 054, 055 | Skills/Tickets/Channels/Workers ship |

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
| 076 | Codex | 033–038 | **P0** Embedded Letta one-app — default product path |
| 078 | Claude | 076 | Provider mirror — write-only BYOK |
| 079 | Codex | 076, 039 | Runtime transport mode matrix doc |
| 039 | Codex | 033–038, **076** | WS/BYOR transport — coordinate lifecycle |
| 058 | Cursor | 045, 039 | Craft P1 robustness |

## Wave 6 — Cognee under Knowledge

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 040 | Codex | 018, 033–038 | Contract + seam |
| 041 | Cursor | 040 | Local home |
| 042 | Cursor | 041 | MCP recall |
| 043 | Cursor | 041, 016 | Capture canon |
| 044 | Claude | 042, 043 | Knowledge graph UI |
| 068 | Codex | 040, 055 | pgvector local recall (parallel optional) |

042 + 043 parallel after 041. **068** can run parallel to 041–044 if Postgres port/instance coordinated.

## Wave 7 — Desktop polish + autonomy depth

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 057 | Claude | 030, 056 | Distinct system icons (Launch Polish) |
| 059 | Claude | 049, 056, 045 | Command station dashboard |
| 060 | Codex | 049, 051, 039 | Worker autonomous loop |
| 061 | Codex | 053, 016, 052 | Practice mining observe |
| 062 | Cursor | 055, 052 | AI Frontier review executor |
| 066 | Cursor | 056, 041 | Skills library seed |

## Wave 8 — Release + public surface

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 063 | Cursor+Claude | 033–038, 045, 048, 051, 054–056 | Release lane — Sebastian gate |
| 064 | Claude | 063, 033, 057 | Remotion/demo refresh |
| 065 | Claude | 063 | Marketing site otto.haus |

## Wave 9 — Otto Cloud (parallel to desktop after 076)

Separate track: Cloudflare control plane + Letta Cloud broker + optional VM. **Do not** run `letta server` on Workers.

| Ticket | Owner | Depends | Notes |
|--------|-------|---------|-------|
| 082 | Codex | 018 | Architecture spec — `docs/v1/otto-web-spec.md` |
| 083 | Claude | 082, 065 | Pages shell + `/api/health` — parked |
| 084 | Cursor | 083 | D1 receipts/proposals — parked |
| 085 | Codex | 084, 079 | Letta env/schedule read — parked |
| 086 | Cursor | 085 | VM `otto-cloud` template — parked |
| 087 | Cursor | 084, 056 | Discord webhooks on Workers — parked |
| 088 | Codex | 087 | WorkOS — parked until multi-user |

082 can complete while desktop waves run. **083** unparks after **065** picks `app.otto.haus` (or equivalent).

## Unpark queue (from `_Parked/`)

| Ticket | Unpark after |
|--------|----------------|
| 019 Intake | 048 |
| 020 Discord | 045, 048, 056 |
| 021 Paperclip read + curation bridge | 048, 051 |
| 074 Paperclip intake surface | 021, 056 |
| 022 Paperclip task create (door) | 021, 049, 051 |
| 075 Paperclip status feedback | 022, 051 |
| 077 Letta Cloud remote | 076, 039 |
| 083 Otto Cloud Pages | 082 reviewed, 065 |
| 084 D1 records | 083 |
| 085 Letta read proxy | 084, 079 |
| 086 Remote env VM | 085 |
| 087 Discord (cloud) | 084, 056 |
| 088 WorkOS | 087 |
| 023 Stacks | 019, 040 |
| 024 People packs | 044, 023 |
| 025 Pinned chat | **cancelled → 046** |

## File / domain conflicts

| Boundary | Tickets | Rule |
|---|---|---|
| Electron/runtime | 039, 045, 058, **076** | Codex owns 076+039 lifecycle + transport |
| Chat.tsx / shell | 033, 045, 046, 048, 049, 069–073, **081** | Serialize onboarding edits |
| Settings.tsx | 001, **076**, **078** | Provider mirror after embedded |
| Panes.tsx | 037, 044, 055, 056, 057, 059, 065 | Claude UI tickets — avoid parallel edits |
| proposal-store | 048, 050, 051, 021 | Codex review for gate logic |
| Paperclip adapter | 021, 074, 022, 075 | Read first; writes only behind approval door |
| infra/pgvector | 068, 041 | One Postgres instance preferred; document ports |
| marketing site/ | 065 | Claude only; no desktop coupling required |
| otto cloud/ Workers | 083–087 | Separate repo path or `apps/cloud/`; no Electron coupling |
| Letta Cloud API | 085, 086, 077 | Shared transport doc 079 |

## Recommended execution order (single lane)

```txt
033–038 → 076 → 078 → 045 → 046–048 → 081 → 054 → 055–056
→ 051 → 049 → 039 + 079 → 047 → 080 → 041–044/068 → 063 → 065
→ unpark 021 → 074 → 022 → 075; 019 → 020; 077 after 039
→ parallel track: 082 → (065) → 083 → 084 → 085 → 086; 087 with 056; 088 later
```

## Blocked / not ready

| Ticket | Blocked on |
|---|---|
| 039 | 033–038 `_Done` |
| 040 | 033–038 `_Done` |
| 063 | Core behavior loop + hygiene |
| 065 | 063 checklist; DNS approval for apex |
| 019–024 | See unpark table |

## Recompute trigger

Refresh after any `_Done` move, `_InReview` move, review -1, unpark, or shared-file conflict.
