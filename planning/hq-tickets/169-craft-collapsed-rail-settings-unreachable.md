# 169 — Settings is unreachable in the collapsed sidebar (narrow width)

Owner: Claude
Priority: P0 (functional dead-end)
Depends on: none
Release bucket: later-generated

## Outcome

At narrow width (<900px), where the sidebar collapses to the 68px icon rail, the
**Settings** entry point is reachable again — its gear icon sits at the bottom
of the rail. Previously the entire lower block was hidden, so there was no way
to open Settings at narrow width.

## Why this matters

This is the single highest-consequence responsive defect in the build — it
**dead-ends the exact recovery path the product points users to**. When the app
is not connected, the chat empty state says *"Open **Settings** to configure"*
and the top pill reads *"NOT CONNECTED"* — but at narrow width there was no
Settings affordance anywhere (the collapsed rail had no gear, and the chat
header has only avatar/title/pill). The user is told to open Settings with no
way to do so. It reads as broken, not merely cramped.

Root cause: the collapse rule
`.sidebar.is-collapsed .sidebar__lower { display: none }` hid the **entire**
lower block — which contains both the operator profile chip *and* the Settings
nav button (`Sidebar.tsx`). The Settings button is a `.nav__item`, so it already
gets the 44px icon-button treatment when collapsed; it was only invisible
because its parent was hidden.

## Scope

- `apps/desktop/src/styles.css`, the `.sidebar.is-collapsed` group: remove
  `.sidebar__lower` from the `display:none` list and instead show it centered
  (`display: grid; justify-items: center`), hiding only the profile chip
  (`.sidebar.is-collapsed .sidebarProfile { display: none }`). CSS-only; no
  markup change (the Settings button already renders).

## Out of scope

- `Sidebar.tsx` (dirty — not touched)
- Expanded-sidebar layout (unchanged; rule is scoped to `.is-collapsed`)

## Done when

- Collapsed rail shows the Settings gear at the bottom; it's clickable
- Expanded sidebar unchanged (Settings + profile render as before)
- Profile chip hidden in the collapsed rail (doesn't fit the icon column)
- `tsc --noEmit` passes; before/after screenshots attached

## Verification

```sh
git status --short --branch
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: at 760px wide, `#chat` collapsed rail ends with the Settings gear
(separated by the lower block's border-top). Wide (1040) sidebar unchanged.

## Collision note

`.sidebar.is-collapsed` group is at committed line ~317 — between the
uncommitted working-tree hunks (≤292 sidebarConv work, next at 642), so it
merges cleanly.

## Blocker log

Leave blank unless blocked.
