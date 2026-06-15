# 168 · craft · Checks nav icon is a light generic stroke check

**Status:** draft PR open · **Surface:** Sidebar nav (Checks) · **Type:** craft / brand consistency

## Outcome
The Checks workspace item now uses a dedicated shield-check glyph that reads as "guard / CI," matching the weight of its Art siblings — instead of a bare stroke checkmark that was both lighter than the family and too generic to convey "Culture CI."

## Root cause
`apps/desktop/src/components/Sidebar.tsx` assigned `checks` → `Icon.check`. `Icon.check` is the inline `<S>` stroke checkmark (a 1.8px line glyph) used generically for confirmations. In the nav it sat among the heavier traced `<Art>` icons, so it read **lighter than every neighbour** (a visible weight inconsistency), and a bare ✓ doesn't communicate "Checks — Culture CI, compiled regressions from Standards." It was a placeholder: the original traced icon set had no Checks glyph. Closes the nav-icon sweep (#165 Knowledge, #166 Tickets, #167 Skills).

## Fix
Add a proper traced shield-check glyph and assign it to Checks:

- **`docs/design/icons/otto-11-checks.svg`** — new design source (shield with an interior check, in the set's drawing convention).
- **`apps/desktop/src/components/icon-art.ts`** — new `checks` entry via the real pipeline (design SVG → headless-Chrome raster → `magick` threshold → `potrace`), same `<g transform>` as the family; source stroke tuned to the family weight range.
- **`apps/desktop/src/components/icons.tsx`** — register `checks: <Art name="checks" />`.
- **`apps/desktop/src/components/Sidebar.tsx`** — `icon: Icon.check` → `icon: Icon.checks` (one line). `Icon.check` stays for its generic uses.

The **shield** silhouette is deliberately distinct from Standards' **circle**-check (the two surfaces are related — Checks compiles regressions from Standards — but now read as guard-vs-canon rather than two identical checks).

## Verification
- `tsc --noEmit -p tsconfig.json` → 0 errors (new `IconArtKey` member consistent across the type, the `Icon` map, and the assignment).
- Vite preview at `#checks`: the nav row shows the shield-check, clearly distinct from Standards' circle-check a few rows up (end-to-end wiring confirmed).
- Rendered the new glyph beside `charter`/`receipts`/`standards` — matches the family weight and stays distinct from Standards (see PR before/after + family shots).
- Collision-safe: `icon-art.ts`, `icons.tsx`, and `Sidebar.tsx` are clean in the working tree and absent from the unpushed `ship/functional-labs` commits.

## Note
`icon-art.ts` is generated (`trace-icons.mjs`, "do not hand-edit") from PNGs in a local `OTTO_ICON_DIR` not in the repo. The `checks` entry is hand-added via the same pipeline; the design SVG is committed so a future re-trace reproduces it.
