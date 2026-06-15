# 136 — Ship Tier Matrix Audit (Functional Ship)

Owner: Codex
Implementer model: Composer 2.5 Fast
Priority: P0
Depends on: none
Release bucket: v0.1 functional ship — **tier truth**

## Outcome

Every user-visible surface and major feature has an explicit **Ship / Labs / Cut** classification, signed off before further implementation.

Output: `docs/v1/ship-tier-matrix.md` — the canonical map for what must work at launch vs what stays behind Labs.

## Why this matters

Folder `_Done/` is not shippable. The new bar:

```txt
Ship  = works end-to-end without Labs
Labs  = Coming soon by default; unlock in Settings → Labs
Cut   = not in product UI (spec/parked only)
```

Without a signed matrix, implementers will keep debating “done” while users hit half-wired panes.

## Scope

- Inventory all **SurfaceId** nav items + Chat sub-flows (onboarding, command station strip, correction, checks block)
- Inventory optional backends: embedded Letta, Cognee, pgvector, Discord/channels, worker loop, practice mining, memory observatory, culture export, cloud connection mode
- For each row: **tier**, **current state** (works / broken / infra), **proof command**, **owner ticket**
- Cross-check against `_Done/` tickets: flag any marked Done that is **Ship-tier** but lacks staging/runtime proof → list for reopen in **138**
- Sebastian review checkpoint: matrix is product truth (not agent draft)

## Proposed starter matrix (implementer validates on staging)

| Item | Proposed tier | Notes |
|------|---------------|-------|
| Chat + threads | Ship | Requires **076** fresh-profile proof |
| Settings + Connect | Ship | |
| Onboarding | Ship | |
| Charters, Standards, Practices, Routines | Ship | File-backed |
| Curation + ratification | Ship | 048→126 chain |
| Receipts | Ship | File read |
| Checks + Chat block | Ship | **135** demo |
| Autonomy | Ship | Policy read |
| Skills | Ship | SkillStore |
| Tickets compile/orchestrate | Ship | Staging smoke |
| Knowledge (Cognee) | Labs | Optional sidecar |
| pgvector recall | Labs | `OTTO_PGVECTOR` |
| Channels outbound | Labs | File contract; no live bot |
| Memory observatory (047) | Labs | Read when runtime up |
| Worker autonomous loop (060) | Labs | |
| Practice mining (061) | Labs | |
| Culture export (125) | Labs | |
| Remote/cloud Letta (077) | Labs | Advanced connection |
| Command Station full (127) | Labs | Strip in Chat may stay Ship |
| Otto Cloud live (083–089) | Cut | |
| Cathedral CP (094–099) | Cut | |
| Paperclip writes (021–022) | Cut | |
| Extension `/ticket` CLI (130) | Cut | |

## Out of scope

- Implementing Labs UI (**137**)
- Fixing Ship-tier gaps (**138**)
- Changing tier assignments without Sebastian note in matrix changelog

## Done when

- [x] `docs/v1/ship-tier-matrix.md` exists with every sidebar surface + listed lab features
- [x] Each Ship row has a named proof command or smoke script path *(staging pass/fail still open)*
- [x] Reopen list appended for Ship-tier `_Done/` tickets missing live proof (ticket ids + reason)
- [x] Ship proof-status column recorded (unit vs staging pending; **138** closes staging gaps)
- [x] Mechanical audit: `bun run check:ship-tier-matrix` in CI
- [ ] Sebastian initials or explicit ack recorded in matrix header (date + “approved tiers”)
- [ ] Reviewer +1: “no Ship row is aspirational without a proof path”

## Verification

```sh
cd /Users/seb/Code/otto
# Staging deploy (never touch live /Applications/otto.app)
OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh

# Walk each Ship row on staging; record pass/fail in matrix
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs

# Optional: onboarding + culture demo when runtime connected
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-onboarding-smoke.cjs
# follow docs/v1/demo-culture-ci.md
```

## Blocker log

Leave blank unless blocked.

## Execution receipt (2026-06-14, issue #129)

- Added `scripts/check-ship-tier-matrix.mjs` — validates `SURFACE_TIER` / `LabFeatureId` ↔ matrix parity; fails if any Ship row lacks a proof path.
- Added `Proof status` column to sidebar + chat sub-flow tables (unit pass vs staging pending).
- Added Reviewer gate section; Sebastian ack still pending.
- Verify: `bun run check:ship-tier-matrix`, `bun test scripts/check-ship-tier-matrix.test.mjs`
