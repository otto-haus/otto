# 057 — System Nav Distinct Icons (Launch Polish)

Owner: Claude
Priority: P2
Depends on: 030, 056
Release bucket: Launch Polish

## Outcome

Skills, Knowledge, Tickets, and Channels sidebar icons are **visually distinct** — not four identical glyphs.

## Why this matters

Craft/audit follow-up; system section readability at a glance.

## Scope

- Reassigned the four unused brand icons from the approved 14-icon set
- Wired in `Sidebar.tsx` / `Icon` map (no new PNGs required)
- 24px grid, warm/ink palette, no line-drawn owl regression

## Done when

- Side-by-side screenshot shows four distinguishable system icons — ✓
- Staging deploy includes assets — ✓
- No accessibility regression (labels remain) — ✓

## Verification

```sh
bun run --cwd apps/desktop build
apps/desktop/scripts/deploy-staging.sh
```

## Execution receipt

Status: done (awaiting reviewer +1)
Date: 2026-06-14

Mapping (System nav → brand icon key):

| Surface | Icon | Rationale |
|---------|------|-----------|
| Skills | `owl` | Capability packages / otto house |
| Knowledge | `theme` | Frontier illumination (model registry) |
| Tickets | `plus` | Create/work slices (distinct from Behavior glyphs) |
| Channels | `send` | Outbound reach |

Commit: `d864c0c` on `ship/v0.3-integration` — `fix(desktop): wire distinct brand icons for System nav`

Proof:

```sh
bun run --cwd apps/desktop build   # exit 0
apps/desktop/scripts/deploy-staging.sh
```

## Blocker log

Leave blank unless blocked.
