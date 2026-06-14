# 164 — One-pager HTML docs are missing a page language

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

All 14 `docs/onepagers/*.html` documents declare `<html lang="en">`, so
assistive tech pronounces them in the right language and the generated PDFs
carry a correct language tag.

## Why this matters

a11y / docs craft (WCAG 3.1.1 "Language of Page"). These one-pagers are
standalone, print-to-Letter HTML documents (`@page { size: Letter }`) — they get
read by screen readers and exported to PDF. Every one of them opened with a bare
`<html>` and no language, so:

- screen readers fall back to the user's default voice/pronunciation rules,
- the PDF export inherits no document language,

across the whole set (`approvals`, `autonomy`, `channels`, `charters`, `checks`,
`curation`, `desktop`, `knowledge`, `otto-v1`, `practices`, `receipts`,
`routines`, `skills`, `standards`). One uniform attribute fixes all of them.

## Scope

- `docs/onepagers/*.html` (14 files): `<html>` → `<html lang="en">` (anchored to
  the `<!DOCTYPE html>` prefix so only the document's opening tag changes).

## Out of scope

- Missing `<title>` on the same docs — also a defect (WCAG 2.4.2), but each needs
  its own per-surface title; a separate, focused pass
- Any content/style change (none — exactly one attribute per file)

## Done when

- Every `docs/onepagers/*.html` opens with `<html lang="en">`
- Diff is +14/−14 (one line each); no other change

## Verification

```sh
git status --short --branch
git diff --stat   # 14 files, 1 line each
for f in docs/onepagers/*.html; do head -c 60 "$f" | grep -oE '<html[^>]*>'; done | sort | uniq -c
# expect: 14  <html lang="en">
```

## Blocker log

Leave blank unless blocked.
