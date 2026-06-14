# 149 — Declare color-scheme: light (no dark UA artifacts on a light app)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The desktop app declares `color-scheme: light`, so native UA-rendered controls
(`<select>` dropdowns, scrollbars, checkboxes, autofill backgrounds, the
pre-CSS canvas) render in light mode and match the warm-paper design even when
the host macOS system is in Dark Mode.

## Why this matters

Craft — a mismatch you only see on a Dark Mode machine, which is exactly the
kind of detail that slips through a light-mode dev setup. otto ships a
deliberately light-only palette (`--bg: #f8f7f2`, warm paper / ink). Nothing in
`index.html` or `styles.css` told the browser that, so Chromium (Electron) falls
back to the OS preference for anything it draws itself. On a Dark Mode system
that means the `charterInput` `<select>` popups, form-control chrome, autofill
fills, and the default canvas paint dark under a light app. One declaration
pins all of it to light.

`<meta name="color-scheme" content="light">` is used (rather than a CSS
`:root { color-scheme }`) because it applies before stylesheet parse — covering
the very first paint too — and keeps the change out of the heavily-churned
`styles.css`.

## Scope

- `apps/desktop/index.html`: add `<meta name="color-scheme" content="light" />`
  to `<head>`.

## Out of scope

- Building a real dark theme (this pins to light by design)
- `styles.css` changes
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- `index.html` head declares `color-scheme: light`
- Native controls / scrollbars / autofill render light on a Dark Mode host
- No other behavioral change

## Verification

Commands/checks to run:

```sh
git status --short --branch
grep -n 'color-scheme' apps/desktop/index.html   # expect content="light"
```

Manual (optional): set macOS to Dark Mode, open the app, open a `<select>` on
the Charters surface — the popup renders light.

## Blocker log

Leave blank unless blocked.
