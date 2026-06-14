# 165 · craft · Knowledge nav icon is a sun (collides with the theme glyph)

**Status:** draft PR open · **Surface:** Sidebar nav (Knowledge) · **Type:** craft / brand consistency

## Outcome
The Knowledge workspace item now uses a dedicated open-book glyph that reads as "knowledge," instead of a sun that has no semantic connection to it — and that was the *same* glyph used for the theme toggle (one icon, two meanings).

## Root cause
`apps/desktop/src/components/Sidebar.tsx` assigned `knowledge` → `Icon.theme`. `Icon.theme` is a **sun** (`<Art name="theme">`), used for light/dark theme switching. Knowledge (sub: "AI Frontier model registry — routing Autonomy and ticket workers") got the sun as a placeholder because the original traced icon set had no Knowledge glyph. Result: a sun labelled "Knowledge", visually identical to the theme control — semantically wrong and ambiguous.

## Fix
Add a proper traced open-book glyph and assign it to Knowledge:

- **`docs/design/icons/otto-08-knowledge.svg`** — new design source (open book, matches the icon-set drawing convention).
- **`apps/desktop/src/components/icon-art.ts`** — new `knowledge` entry, produced through the real pipeline (design SVG → headless-Chrome raster → `magick` threshold → `potrace`), same `<g transform>` as the family. Stroke weight was tuned (rendered at a thinner source stroke) so the traced outline matches `charter`/`receipts`/`practices` at the 18px nav size.
- **`apps/desktop/src/components/icons.tsx`** — register `knowledge: <Art name="knowledge" />`.
- **`apps/desktop/src/components/Sidebar.tsx`** — `icon: Icon.theme` → `icon: Icon.knowledge` (one line). The theme toggle keeps its sun.

## Verification
- `tsc --noEmit -p tsconfig.json` → 0 errors (new `IconArtKey` member is consistent across the type, the `Icon` map, and the assignment).
- Vite preview at `#knowledge`: the nav rail now shows the open book (end-to-end wiring confirmed).
- Rendered the new glyph beside `charter`/`receipts`/`practices` — reads as a book and matches the family weight at nav size (see PR before/after + family-weight shots).
- Collision-safe: `icon-art.ts`, `icons.tsx`, and `Sidebar.tsx` are all clean in the working tree and absent from the unpushed `ship/functional-labs` commits.

## Note
`icon-art.ts` is generated (`trace-icons.mjs`, "do not hand-edit") from PNGs in a local `OTTO_ICON_DIR` not in the public repo. The `knowledge` entry is hand-added via the same pipeline; the design SVG is committed so a future re-trace (once a Knowledge PNG is added to the MAP) reproduces it. Until then, a full re-run of `trace-icons.mjs` would need the new icon added to its MAP to avoid dropping it.
