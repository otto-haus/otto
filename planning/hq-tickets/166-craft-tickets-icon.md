# 166 · craft · Tickets nav icon is a plus (collides with "New chat")

**Status:** draft PR open · **Surface:** Sidebar nav (Tickets) · **Type:** craft / brand consistency

## Outcome
The Tickets workspace item now uses a dedicated ticket-stub glyph instead of a plus — the same glyph used by the "New chat" button — so the two no longer read as the same thing.

## Root cause
`apps/desktop/src/components/Sidebar.tsx` assigned `tickets` → `Icon.plus`. `Icon.plus` is the "add / new" glyph used by the **New chat** button at the top of the sidebar. So a plus appeared twice — once meaning "start a new chat", once labelled "Tickets" — which is ambiguous. It was a placeholder: the original traced icon set had no Tickets glyph. (Same class of issue as #165, Knowledge → the theme sun.)

## Fix
Add a proper traced ticket-stub glyph and assign it to Tickets:

- **`docs/design/icons/otto-09-tickets.svg`** — new design source (horizontal ticket with edge notches + perforation, in the set's drawing convention).
- **`apps/desktop/src/components/icon-art.ts`** — new `tickets` entry produced through the real pipeline (design SVG → headless-Chrome raster → `magick` threshold → `potrace`), same `<g transform>` as the family; source stroke tuned so the traced outline sits in the family weight range (matches `panel`).
- **`apps/desktop/src/components/icons.tsx`** — register `tickets: <Art name="tickets" />`.
- **`apps/desktop/src/components/Sidebar.tsx`** — `icon: Icon.plus` → `icon: Icon.tickets` (one line). The New chat button keeps its plus.

## Verification
- `tsc --noEmit -p tsconfig.json` → 0 errors (new `IconArtKey` member consistent across the type, the `Icon` map, and the assignment).
- Vite preview at `#tickets`: the nav row now shows the ticket stub (end-to-end wiring confirmed); the New chat plus is no longer duplicated.
- Rendered the new glyph beside `charter`/`receipts`/`panel` — reads as a ticket and matches the family weight at nav size (see PR before/after + family shots).
- Collision-safe: `icon-art.ts`, `icons.tsx`, and `Sidebar.tsx` are clean in the working tree and absent from the unpushed `ship/functional-labs` commits.

## Note
`icon-art.ts` is generated (`trace-icons.mjs`, "do not hand-edit") from PNGs in a local `OTTO_ICON_DIR` not in the repo. The `tickets` entry is hand-added via the same pipeline; the design SVG is committed so a future re-trace reproduces it (add a Tickets PNG to the script's MAP).
