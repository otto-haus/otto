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

- New or reassigned SVG icons per surface (follow `otto-icon-prompts.md` / Brand Style Guide)
- Wire in `Sidebar.tsx` / icon map
- 24px grid, warm/ink palette, no line-drawn owl regression

## Out of scope

- Re-icon entire app
- Animated icons

## Done when

- Side-by-side screenshot shows four distinguishable system icons
- Staging deploy includes assets
- No accessibility regression (labels remain)

## Verification

```sh
bun run --cwd apps/desktop build
apps/desktop/scripts/deploy-staging.sh
```

## Blocker log

Leave blank unless blocked.
