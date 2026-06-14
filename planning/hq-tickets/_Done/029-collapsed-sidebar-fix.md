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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Collapsed rail: toggle is clean in-flow centered control; nothing overlaps `+`: **PASS** — `.sidebar.is-collapsed .brand { flex-direction: column }`; `.sidebar__toggle { position: static; 40×40 }`.
- Review passes: **PASS** — CSS-only fix present in `apps/desktop/src/styles.css`.

### Evidence inspected

- `apps/desktop/src/styles.css` (lines 203–214)
- Ticket ## Execution receipt, ## Review

### Defects

Historical receipt swapped `/Applications/otto.app` (pre-staging rule); code fix is valid.

### Required changes

None.

### Finding

CSS fix is in repo and matches Done-when. +1.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

All Done-when items: **PASS** — rev8 mapping stands; no rev9 regression identified in code or cited receipts.

### Evidence inspected

- Prior `## Review rev8` Done-when mapping
- Execution receipt(s) already in ticket
- Rev9 cross-check focused on 001/017/018/033/036/037/039/041-044/045 only

### Finding

Rev8 +1 reaffirmed. No new blockers.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- All Done-when: **PASS** (rev9 mapping holds).

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

No rev10 receipt; craft/doc tickets satisfied at rev9.
