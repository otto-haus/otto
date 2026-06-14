# 162 · craft · "otto" wordmark looks squished

**Status:** draft PR open · **Surface:** Sidebar header (brand) · **Type:** craft / brand consistency

## Outcome
The "otto" wordmark in the sidebar header reads open and balanced instead of cramped. Sebastian flagged it directly from the running app ("do you see the otto wordmark — it seems so squished!").

## Root cause
`.brand__name` (`apps/desktop/src/styles.css`) set `letter-spacing: -0.045em` on the 21px / 700-weight Inter wordmark. That's aggressive negative tracking — at this size it jams the middle "tt" together and compresses the whole word, which reads as "squished."

## Fix
Loosen the tracking to `-0.02em` — enough to give the letters (especially the "tt") breathing room while keeping a subtle, intentional tightness for the bold display look. Nothing else changes (size, weight, line-height untouched).

```diff
- .brand__name { font-size: 21px; font-weight: 700; letter-spacing: -0.045em; line-height: 1; }
+ .brand__name { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
```

`-0.02em` was chosen by rendering candidates (`-0.045 → 0`) in real Inter 700 at the exact 21px spec: `-0.02em` relieves the squish without going fully neutral (which loses the branded tightness). See PR before/after.

## Verification
- Rendered the `.brand__name` spec (Inter 700, 21px) before/after at real size and 3× zoom — the "tt" un-crams and the word opens up (see PR).
- CSS-only, single value changed — no TypeScript touched (tsc unaffected).
- Collision-safe: `styles.css` working tree is clean; `.brand__name` (line 116) is byte-identical between origin and Sebastian's unpushed commits, and no unpushed hunk touches the line-116 vicinity — this one-line change merges cleanly with his in-flight rework.
