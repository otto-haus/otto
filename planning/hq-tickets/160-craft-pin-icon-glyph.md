# 160 · craft · Pin icon glyph is lopsided

**Status:** draft PR open · **Surface:** Sidebar (Pinned threads) · **Type:** craft / brand consistency

## Outcome
The `pin` icon used on conversation rows and the Pinned section now reads as a clean, symmetric pushpin instead of a lopsided diagonal scribble. Sebastian flagged it directly from the running app ("same with the pin").

## Root cause
`apps/desktop/src/components/icons.tsx` defined `pin` as a hand-rolled two-stroke path:

```
m14.5 4.5 5 5-3.1 1.1-3.2 3.2-.6 4.7-2.9-2.9-4.2 4.2   +   m9.5 9.5 5 5
```

The "head" is an irregular quadrilateral and the needle runs off-axis, so the glyph is asymmetric and unbalanced — it does not read as a pin at the 18px sidebar size and clashes with the otherwise clean, geometric stroke-icon family (`clock`, `archive`, `lock`, …).

## Fix
Replace the path with a standard symmetric vertical pushpin, rendered through the same `<S>` wrapper (viewBox `0 0 24 24`, `stroke-width 1.8`, round caps/joins) so it inherits the family's exact weight and style. One line changed, no other icon touched.

```diff
- pin: <S><path d="m14.5 4.5 5 5-3.1 1.1-3.2 3.2-.6 4.7-2.9-2.9-4.2 4.2" /><path d="m9.5 9.5 5 5" /></S>,
+ pin: <S><path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></S>,
```

## Verification
- Rendered before/after at the real 18px sidebar size and 3× zoom — the new glyph is symmetric and legible (see PR before/after).
- `tsc --noEmit -p tsconfig.json` → 0 errors.
- Collision-safe: `icons.tsx` is clean in the working tree and absent from the unpushed `ship/functional-labs` commits; scoped to the single `pin` entry.
