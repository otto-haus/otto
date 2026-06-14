# 031 — Sidebar logo alignment

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The sidebar owl+otto logo aligns with the nav below it instead of floating centered.

## Scope

- CSS-only in `apps/desktop/src/styles.css` (`.brand`).

## Done when

- Logo left-aligns with the nav; toggle unaffected.  ✓
- Review passes.  ✓

## Execution receipt

Status: done
Date: 2026-06-13

- Applied in `otto-v01-integration`: `.brand { justify-content: flex-start; padding: 0 40px 4px 8px; }`
  (left-aligned; the 40px right padding reserves room for the absolute toggle).
- Built + swapped into `/Applications/otto.app` + re-signed + relaunched.

## Review (independent subagent)

Verdict: PASS — 2026-06-13.
- `.brand` is `justify-content: flex-start` with `padding: 0 40px 4px 8px`; left-aligned, not centered.
- base `.sidebar__toggle` stays absolute `right:3px; top:5px`, fits the 40px right padding.
- no syntax breakage; existing tokens.

Accepted → `_Done`.

## Blocker log

(none)
