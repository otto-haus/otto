# 167 · craft · Skills nav icon is the owl brand mark

**Status:** draft PR open · **Surface:** Sidebar nav (Skills) · **Type:** craft / brand consistency

## Outcome
The Skills workspace item now uses a dedicated package/box glyph that reads as "capability packages," instead of the owl-in-a-house brand mark.

## Root cause
`apps/desktop/src/components/Sidebar.tsx` assigned `skills` → `Icon.owl`. `Icon.owl` is otto's **owl-in-a-house brand motif** — it echoes the brand avatar (footer "Local operator", chat message avatars) and has no connection to "Skills" (sub: "Reusable capability packages loaded from `skill/**/SKILL.md`"). It was a placeholder: the original traced icon set had no Skills glyph. (Same class as #165 Knowledge → theme sun, #166 Tickets → New-chat plus.)

## Fix
Add a proper traced package glyph and assign it to Skills:

- **`docs/design/icons/otto-10-skills.svg`** — new design source (isometric package box, in the set's drawing convention).
- **`apps/desktop/src/components/icon-art.ts`** — new `skills` entry produced through the real pipeline (design SVG → headless-Chrome raster → `magick` threshold → `potrace`), same `<g transform>` as the family; source stroke tuned to the family weight range.
- **`apps/desktop/src/components/icons.tsx`** — register `skills: <Art name="skills" />`.
- **`apps/desktop/src/components/Sidebar.tsx`** — `icon: Icon.owl` → `icon: Icon.skills` (one line). `Icon.owl` stays defined (it was only used here) for future brand use.

## Verification
- `tsc --noEmit -p tsconfig.json` → 0 errors (new `IconArtKey` member consistent across the type, the `Icon` map, and the assignment).
- Vite preview at `#skills`: the nav row now shows the package (end-to-end wiring confirmed).
- Rendered the new glyph beside `charter`/`receipts`/`curation` — reads as a package and matches the family weight at nav size (see PR before/after + family shots).
- Collision-safe: `icon-art.ts`, `icons.tsx`, and `Sidebar.tsx` are clean in the working tree and absent from the unpushed `ship/functional-labs` commits.

## Note
`icon-art.ts` is generated (`trace-icons.mjs`, "do not hand-edit") from PNGs in a local `OTTO_ICON_DIR` not in the repo. The `skills` entry is hand-added via the same pipeline; the design SVG is committed so a future re-trace reproduces it.
