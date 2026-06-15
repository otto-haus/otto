# 163 · craft · Settings hint paragraphs run the full window width

**Status:** draft PR open · **Surface:** Settings (live) · **Type:** craft / typography

## Outcome
Secondary note paragraphs in Settings now wrap at the same readable measure as the section intros, instead of running edge-to-edge across the whole window.

## Root cause
On the content-rich Settings surface, two paragraph styles set the body copy:
- `.settingsSectionHeader__lede` (section intros) — has `max-width: 58ch`, so lines stay a readable length.
- `.settingsFieldHint` (the secondary notes, e.g. the Connection caveat and the Memory observatory note) — had **no `max-width`**, so on a desktop window those lines ran the full ~1320px (well over 120 characters), and sat inconsistently next to the constrained intro right above them.

The result: in one section, the intro wraps at ~58 characters while the note below it spans the entire width — visibly uneven, and too long to read comfortably.

## Fix
Give `.settingsFieldHint` the same character measure as the lede:

```diff
- .settingsFieldHint { margin: 0; font-size: 13px; color: var(--mut); line-height: 1.45; }
+ .settingsFieldHint { margin: 0; font-size: 13px; color: var(--mut); line-height: 1.45; max-width: 58ch; }
```

`max-width` only caps over-long lines — in the narrower flex-row hints (e.g. the Onboarding row) it has no effect, so nothing else changes.

## Verification
- Vite preview at desktop width (1360px), before/after via HMR: the Connection and Memory notes now wrap at ~58ch matching the intro above them; the full-width "Setup required" notice box and the inline onboarding-row hint are unchanged — no regression (see PR).
- CSS-only, single property added — no TypeScript touched.
- Collision-safe: `styles.css` working tree is clean and `.settingsFieldHint` (line 1818) sits outside every unpushed `ship/functional-labs` hunk — merges cleanly with the in-flight rework.
