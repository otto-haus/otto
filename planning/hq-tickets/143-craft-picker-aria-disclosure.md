# 143 — Chat model/effort pickers: ARIA disclosure semantics

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The model and reasoning-effort pickers in the chat compose bar announce
themselves correctly to assistive technology: each trigger reports that it
owns a popup menu and whether that menu is open, and each option reports its
selected state. A screen-reader user can operate the pickers with the same
confidence a sighted user gets from the rotating chevron.

## Why this matters

This is craft, not capability — the little stuff that compounds into trust.
The pickers already worked visually (the `data-open` chevron rotates), but the
open/closed state and current selection were invisible to assistive tech. A
screen reader announced a bare value like "Opus, button" with no hint that it
toggles a menu, no open/closed state, and no "selected" on the active option.
Otto ships to operators; the console should be legible to all of them.

## Scope

- `apps/desktop/src/surfaces/Chat.tsx` — model picker (`picker__button`) and
  effort picker (`picker__button--effort`):
  - `aria-haspopup="menu"` + `aria-expanded={modelOpen|effortOpen}` on triggers
  - `aria-label` on triggers so the accessible name states the control's
    purpose ("Model: Opus" / "Reasoning effort: high"), not just the value
  - `role="menu"` + `aria-label` on the two `picker__menu` containers
  - `role="menuitemradio"` + `aria-checked` on each option, mirroring the
    existing `is-selected` visual state

## Out of scope

- Keyboard arrow-key roving focus inside the menu (buttons remain Tab/Enter
  operable; not regressed by this change)
- Any visual restyle of the pickers
- Paperclip / Cognee / Stacks
- Broad redesign

## Done when

- Both pickers expose `aria-haspopup`/`aria-expanded` that track open state
- Both menus expose `role="menu"`; options expose `role="menuitemradio"` +
  `aria-checked` reflecting the current selection
- `tsc --noEmit` passes for `apps/desktop`
- No visual or behavioral change for sighted/mouse users

## Verification

Commands/checks to run:

```sh
git status --short --branch
# typecheck (desktop)
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

## Blocker log

Leave blank unless blocked.
