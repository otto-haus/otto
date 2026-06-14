# 029 — Collapsed sidebar layout fix (craft)

Owner: Claude
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

When the sidebar is collapsed, the collapse toggle no longer overlaps the New-chat (+) button;
the rail reads as a clean vertical stack.

## Scope

- CSS-only in `apps/desktop/src/styles.css`.

## Done when

- Collapsed rail: toggle is a clean in-flow centered control; nothing overlaps the `+` button.  ✓
- Review passes.  ✓

## Execution receipt

Status: done
Date: 2026-06-13

- Applied in `otto-v01-integration`: `.sidebar.is-collapsed .brand` → `flex-direction: column` + gap
  (avatar + toggle stack); `.sidebar.is-collapsed .sidebar__toggle` → `position: static; 40x40`
  (removed the floating `top:52px; right:-10px` rule).
- Built (typecheck + electron:build pass), swapped into `/Applications/otto.app`, re-signed, relaunched.

## Review (independent subagent)

Verdict: PASS — 2026-06-13.
- collapsed `.brand` is `flex-direction: column` + gap; avatar + toggle stack as a column.
- collapsed `.sidebar__toggle` is `position: static`; the old `top:52px; right:-10px` rule is gone (grep: NONE).
- toggle is not in the `display:none` group; stays visible/in-flow; no overlap with the 44×44 `+` button.
- no syntax breakage; existing tokens.

Accepted → `_Done`.

## Blocker log

(none)
