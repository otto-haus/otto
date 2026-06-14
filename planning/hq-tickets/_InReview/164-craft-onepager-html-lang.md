# 164 — One-pager HTML docs are missing a page language

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

All 14 `docs/onepagers/*.html` documents declare `<html lang="en">`, so
assistive tech and print/PDF export paths have an explicit page-language source.

## Why this matters

a11y / docs craft (WCAG 3.1.1 "Language of Page"). These one-pagers are
standalone, print-to-Letter HTML documents (`@page { size: Letter }`) — they get
read by screen readers and exported to PDF. Every one of them opened with a bare
`<html>` and no language, so:

- screen readers fall back to the user's default voice/pronunciation rules,
- the PDF export has no explicit document-language source to preserve,

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
- The `docs/onepagers/*.html` diff is one opening-tag attribute per file; no
  content/style change

## Verification

```sh
git status --short --branch
git diff --stat -- docs/onepagers/*.html   # 14 files, 1 line each
for f in docs/onepagers/*.html; do head -c 60 "$f" | grep -oE '<html[^>]*>'; done | sort | uniq -c
# expect: 14  <html lang="en">
```

## Execution receipt

2026-06-14 Codex review/repair:

- Confirmed all 14 `docs/onepagers/*.html` files open with
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">`.
- Confirmed the one-pager diff against `origin/ship/functional-labs` is 14
  files changed, 14 insertions, 14 deletions.
- Moved this ticket to `_InReview` and narrowed outcome wording to the source
  HTML language declaration. PDF export metadata was not inspected in this PR.
- Checked open PR file overlap: no currently open PR overlaps this branch's
  changed files.
- Checked `git merge-tree $(git merge-base HEAD origin/ship/functional-labs) HEAD origin/ship/functional-labs`:
  no conflicts.
- Verification passed: `bun install --frozen-lockfile`; `bun run typecheck`;
  `bun run --cwd apps/desktop typecheck`; `bun run --cwd apps/desktop electron:typecheck`;
  `bun test` (221 pass, 1 skip, 0 fail); `bun run verify:v0` (5 passed, 0
  failed); `git diff --check`.
- Screenshots: N/A, static docs-only invisible `lang` attribute change.

## Blocker log

Leave blank unless blocked.
