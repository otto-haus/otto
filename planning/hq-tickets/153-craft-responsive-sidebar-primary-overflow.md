# 153 — Responsive sidebar: stop "New chat" label overflowing the collapsed rail

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

When the window narrows past the 900px breakpoint and the sidebar collapses to
the 68px icon rail, the "New chat" primary button becomes a clean centered "+"
icon — matching the nav icons and the manual-collapse state — instead of letting
its "New chat" label overflow the rail and spill into the content area.

## Why this matters

A clear responsive bug that reads as broken: at ≤900px the `@media` rule shrank
the sidebar to 68px and hid the nav labels, but it forgot the primary button's
own label (`.sidebar__primaryText`) and never re-centered `.sidebar__primary`.
So the words "New chat" spilled out of the rail and overlapped the surface
content. The manual collapse (`.sidebar.is-collapsed`) already handles this
(hides the text, centers the button); the responsive breakpoint just missed the
same two declarations.

## Scope

- `apps/desktop/src/styles.css`, the `@media (max-width: 900px)` block:
  - add `.sidebar__primaryText` to the `display: none` group
  - add `.sidebar__primary` to the `justify-content: center; padding-left: 0;
    padding-right: 0;` rule (so the "+" centers in the rail)

## Out of scope

- The manual `.sidebar.is-collapsed` path (already correct; untouched)
- Wide layout ≥901px (media query doesn't apply there; unchanged)
- Unifying the two collapse mechanisms into shared styles (possible follow-up)
- Any markup/runtime change

## Done when

- At ≤900px the primary button is an icon-only centered "+" with no overflow
- ≥901px layout unchanged; manual collapse unchanged
- `tsc --noEmit` (app) passes
- Before/after screenshots attached to the PR

## Verification

```sh
git status --short --branch
grep -n 'sidebar__primaryText' apps/desktop/src/styles.css   # now in the media query too
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: resize below 900px (or screenshot at 680–760px) — the "+" centers in
the rail, no "New chat" text bleeding into content. Headless Chrome vs Vite
preview.

## Blocker log

Leave blank unless blocked.
