# 174 — One-pager HTML docs are missing a page <title>

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

All 14 `docs/onepagers/*.html` documents declare a `<title>` (e.g.
`otto — Checks one-pager`), so the browser tab, bookmarks, and the exported PDF
carry a real document name instead of the file path/URL.

## Why this matters

a11y + artifact quality (WCAG 2.4.2 "Page Titled"). These are standalone,
print-to-Letter one-pagers that get viewed in a browser and exported to PDF.
Every one opened `<head>` with `<meta charset="utf-8">` and **no `<title>`** — so
the tab showed the raw filename/URL and the generated PDF had no document title.
(Follows #168, which added `<html lang>` to the same docs.)

## Scope

- `docs/onepagers/*.html` (14 files): insert
  `<title>otto — {Surface} one-pager</title>` after `<meta charset="utf-8">`.
  Surface name per file (Approvals, Autonomy, Channels, Charters, Checks,
  Curation, Desktop, Knowledge, v1, Practices, Receipts, Routines, Skills,
  Standards). One line per file (+14/-14).

## Out of scope

- Any content/style change (one `<title>` element per file)

## Done when

- Every `docs/onepagers/*.html` has a distinct, accurate `<title>`
- Docs still render correctly (verified one in Chrome)
- Diff is +14/−14 (one line each)

## Verification

```sh
git status --short --branch
for f in docs/onepagers/*.html; do grep -oE '<title>[^<]*</title>' "$f" | head -1; done   # 14 titles
git diff --stat   # 14 files, 1 line each
```

Chrome readout confirms the page `<title>` is set; the doc renders unchanged.

## Blocker log

Leave blank unless blocked.
