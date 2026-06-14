# 149 — Declare color-scheme: light (no dark UA artifacts on a light app)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The desktop app declares `color-scheme: light` in both the first-paint HTML
metadata and the runtime CSS root, so native UA-rendered controls (`<select>`
dropdowns, scrollbars, checkboxes, autofill backgrounds, the pre-CSS canvas)
render in light mode and match the warm-paper design even when the host macOS
system is in Dark Mode.

## Why this matters

Craft — a mismatch you only see on a Dark Mode machine, which is exactly the
kind of detail that slips through a light-mode dev setup. otto ships a
deliberately light-only palette (`--bg: #f8f7f2`, warm paper / ink). Nothing in
`index.html` or `styles.css` told the browser that, so Chromium (Electron) falls
back to the OS preference for anything it draws itself. On a Dark Mode system
that means the `charterInput` `<select>` popups, form-control chrome, autofill
fills, and the default canvas paint dark under a light app. One declaration
pins all of it to light.

`<meta name="color-scheme" content="light">` applies before stylesheet parse,
covering the very first paint. `:root { color-scheme: light; }` keeps the
runtime document and native controls explicitly pinned to light after CSS loads.

## Scope

- `apps/desktop/index.html`: add `<meta name="color-scheme" content="light" />`
  to `<head>`.
- `apps/desktop/src/styles.css`: add `color-scheme: light` to `:root`.

## Out of scope

- Building a real dark theme (this pins to light by design)
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
grep -n 'color-scheme: light' apps/desktop/src/styles.css
```

Manual (optional): set macOS to Dark Mode, open the app, open a `<select>` on
the Charters surface — the popup renders light.

## Blocker log

Leave blank unless blocked.

## Execution receipt

- Repo path: `/Users/seb/Code/otto-pr-20`
- Branch: `craft/color-scheme-light`
- Files changed:
  - `apps/desktop/index.html`
  - `apps/desktop/src/styles.css`
  - `docs/receipts/staging/pr-20/summary.json`
  - `docs/receipts/staging/pr-20/desktop-home.png`
  - `docs/receipts/staging/pr-20/codex-review-dark-mode-native-controls-with-meta.png`
  - `docs/receipts/staging/pr-20/codex-review-dark-mode-native-controls.json`
- Commands/checks:
  - `rg -n '<meta name="color-scheme" content="light"' apps/desktop/index.html`
  - `rg -n 'color-scheme: light' apps/desktop/src/styles.css`
  - Dark Mode browser proof at `http://127.0.0.1:5220/#charters` with viewport `1280x760`
- UI proof:
  - `docs/receipts/staging/pr-20/codex-review-dark-mode-native-controls-with-meta.png`
  - `docs/receipts/staging/pr-20/codex-review-dark-mode-native-controls.json`
- Known gaps:
  - Browser plugin `iab` endpoint was unavailable; proof used the existing admin Playwright package through `NODE_PATH`.
  - Web preview cannot read the local charter store, so the proof injected native controls into the real `#charters` document to verify UA control color-scheme under emulated Dark Mode.

## Review

Verdict: +1

Evidence:
- `index.html` declares `<meta name="color-scheme" content="light" />` before app scripts/styles.
- `styles.css` declares `color-scheme: light` on `:root`.
- Dark Mode proof data reports `prefersDarkMatches: true`, `metaColorScheme: "light"`, `documentColorScheme: "light"`, proof select/input/checkbox `colorScheme: "light"`, warm-paper body colors, and zero console warnings/errors.

Unmet Done when items: none.

Exact fixes required: none.

May move to `_Done`: yes.
