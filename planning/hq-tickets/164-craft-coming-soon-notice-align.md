# 164 · craft · Coming-soon notice text floats centered away from its dot

**Status:** draft PR open · **Surface:** Workspace coming-soon surfaces (~13 of 14) · **Type:** craft / alignment

## Outcome
The status notice on every coming-soon workspace surface ("Chat and Settings are live today…") now reads as a proper left-aligned status line, with its dot anchoring the first line — instead of the copy floating centered, disconnected from the left-pinned dot.

## Root cause
`.notice` is `display: inline-flex; align-items: center` with a leading status dot and the message text. It sets no `text-align` of its own, so inside the coming-soon panel it inherits `text-align: center` from the centered `.emptySurface` parent. When the message wraps to two lines, both lines center within the text — so the second line ("wiring up for v1.") sits centered under the first while the dot stays pinned far-left and vertically mid-block. The dot reads as detached from the text it's marking.

`.notice` is shared by ~25 call sites (settings errors, Checks, etc.), all in left-aligned containers — so the defect is specific to the centered empty-state context.

## Fix
Scope the correction to the empty-state context only:

```diff
+ /* In centered empty/coming-soon surfaces the notice text inherited text-align:center,
+    floating it away from its left-pinned dot; keep the copy left-read and top-align the dot. */
+ .emptySurface .notice { text-align: left; align-items: flex-start; }
```

`text-align: left` makes the wrapped copy read left-to-right; `align-items: flex-start` lifts the dot to the first line so it anchors the message. The global `.notice` and its 25 other usages are untouched.

## Verification
- Vite preview at the coming-soon surface (`#charters`), before/after via HMR at matched framing: the two-line message left-aligns and the dot moves to the first line (see PR). Reaches every coming-soon surface.
- CSS-only, additive (one scoped rule) — no TypeScript touched; no other `.notice` affected.
- Collision-safe: `styles.css` working tree is clean and the rule is inserted at line ~1249, outside every unpushed `ship/functional-labs` hunk — merges cleanly with the in-flight rework.
