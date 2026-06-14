# 161 · craft · Chat nav icon reads as a cyclops eye

**Status:** draft PR open · **Surface:** Sidebar nav (Chat) · **Type:** craft / brand consistency

## Outcome
The `chat` nav icon now reads as a clear conversation glyph — a speech bubble with a three-dot "typing" motif — instead of a speech bubble containing a single staring eye. Sebastian flagged it directly from the running app ("the chat one came out funny").

## Root cause
The workspace icons are auto-traced (`apps/desktop/scripts/trace-icons.mjs` → `icon-art.ts`) from approved design PNGs. The chat design (`docs/design/icons/otto-03-chat.svg`) placed a single large eye (a `r=2.4` ring + filled `r=0.95` pupil) inside the bubble. Traced and rendered at 18px, that single off-centre eye reads as a camera/cyclops, not a conversation — and it's the only nav glyph with an enclosed "eye", so it stands out as odd next to its clean siblings (`charter`, `receipts`, `settings`, …).

## Fix
Replace the eye with a three-dot typing indicator — the universal "chat" motif — in **both** the design source and the rendered art, keeping everything else identical:

- **`docs/design/icons/otto-03-chat.svg`** (source of truth): swap the eye ring + pupil for three `r=1` dots at `cx 8.5 / 12 / 15.5`, `cy 10.5`. Bubble path unchanged.
- **`apps/desktop/src/components/icon-art.ts`** (what the app renders): the bubble path is left **byte-identical** (so its stroke weight stays matched to the family); the traced eye-ring path is removed and the existing pupil path is reused three times, translated horizontally (`M2443` → `M1696` / `M2443` / `M3190`) to the same dot positions. This is exactly what re-running the trace pipeline on the new source produces, but weight-stable.

## Verification
- Rendered the patched `icon-art.ts` alongside `charter / receipts / settings / owl / curation` — the new chat glyph matches the family stroke weight and reads cleanly at both 96px and the real 18px nav size (see PR before/after).
- `tsc --noEmit -p tsconfig.json` → 0 errors.
- Collision-safe: both files are clean in the working tree and absent from the unpushed `ship/functional-labs` commits. Diff is scoped to the chat entry only (bubble untouched).

## Note
`icon-art.ts` is generated ("do not hand-edit"); the source PNGs live in a local `OTTO_ICON_DIR` not in the public repo, so a full re-trace isn't reproducible here. The design SVG is updated too, so the next legitimate re-trace reproduces this fix rather than reverting it.
