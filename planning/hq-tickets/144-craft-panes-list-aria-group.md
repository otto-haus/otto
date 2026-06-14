# 144 — Charter/receipt card lists: make their aria-label actually announce

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The charter list and receipt list in Practices/Receipts surfaces expose their
intended accessible name ("Charters list" / "Receipts list") to assistive
technology. Previously the `aria-label` was attached to a bare `<div>`, which
has the implicit role "generic" — and `aria-label` on a generic element is
silently ignored by browsers and screen readers. The labels looked correct in
the source but did nothing at runtime.

## Why this matters

Pure craft — the little stuff that compounds into trust. Someone took the
trouble to label these lists; the label just never reached a screen reader
because the host element couldn't carry an accessible name. Adding the right
role turns dead markup into a working landmark name, so a screen-reader user
navigating the Practices/Receipts surfaces hears "Charters list, group"
instead of an anonymous pile of cards.

## Scope

- `apps/desktop/src/components/ui/SurfaceLayout.tsx`
  - `SplitLayout`: optional `listAriaLabel` + `listClassName`; when label set, apply `role="group"`
- `apps/desktop/src/surfaces/Panes.tsx`
  - charters `SplitLayout`: `listClassName="charterList"` + `listAriaLabel="Charters list"`
  - receipts `SplitLayout`: `listClassName="receiptList"` + `listAriaLabel="Receipts list"`

`role="group"` (not `role="list"`) is deliberate: the list children are
interactive `<button>` cards, and `role="list"` would require `role="listitem"`
children, which would clobber the buttons' own semantics. `group` supports an
accessible name without touching the children.

## Out of scope

- The `segmented` containers (already `role="tablist"`) and the settings
  `<aside>` (a landmark that already carries its label) — both already correct
- Restructuring the card lists into semantic `<ul>`/`<li>`
- Any visual change
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Both card-list containers carry `role="group"` so their existing
  `aria-label` is honored by assistive tech
- `tsc --noEmit` passes for `apps/desktop`
- No visual or behavioral change for sighted/mouse users

## Verification

Commands/checks to run:

```sh
git status --short --branch
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

## Blocker log

Leave blank unless blocked.
