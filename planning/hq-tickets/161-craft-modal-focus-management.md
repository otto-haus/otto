# 161 — Modal: move focus into the dialog on open (and restore on close)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

When a `Modal` opens, focus moves into the dialog so keyboard and screen-reader
users land inside it (and hear its accessible name); when it closes, focus
returns to the element that opened it. Previously focus stayed behind the
modal — users had to tab through the whole page to reach it, and the dialog was
not announced.

## Why this matters

a11y — `Modal` already had the right semantics (`role="dialog"`, `aria-modal`,
`aria-labelledby`, Escape-to-close, backdrop-close, labeled close button) but
was missing the other half of an accessible dialog: **focus management**
(WCAG 2.4.3 Focus Order; APG dialog pattern). Without it, an `aria-modal` dialog
traps nothing and announces nothing on open, and on close focus is lost to the
top of the document. The Modal backs the permission-approval card, the
propose-correction modal, and the memory-writeback gate — all consequential,
keyboard-driven moments.

## Scope

- `apps/desktop/src/components/ui/Modal.tsx`:
  - `useRef` for the dialog element + the previously-focused element
  - on open: store `document.activeElement`, focus the dialog
  - on close/unmount: restore focus to the stored element
  - `ref` + `tabIndex={-1}` on `.modal__dialog` so it can receive focus

## Out of scope

- A full focus *trap* (cycling Tab within the dialog) — larger; initial focus +
  restore is the high-value, low-risk first step
- Any visual/CSS change (none — `styles.css` untouched)
- Runtime/architecture change

## Done when

- Opening a Modal moves focus to the dialog; closing restores it to the trigger
- `tsc --noEmit` (app) passes
- No visual change (verified: a content-rich surface renders identically)

## Verification

```sh
git status --short --branch
grep -n 'dialogRef\|restoreFocusRef\|tabIndex' apps/desktop/src/components/ui/Modal.tsx
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Note: the Modal's triggers are chat-runtime-gated, so it isn't reachable in the
web preview — visual before/after doesn't apply. Proof is the diff + typecheck +
a no-regression screenshot of `#settings` (unchanged).

## Blocker log

Leave blank unless blocked.
