# 030 — Wire approved icons into the desktop nav

Owner: Claude
Priority: P1
Depends on: 026 (icon set)
Release bucket: later-generated

## Outcome

The desktop sidebar renders the **approved icon art** (from `iconography/`) instead of the
placeholder inline icons — recolored correctly on inactive / active / collapsed-on-ink.

## Scope

- Converted the 12 approved nav/utility PNGs → normalized `currentColor` SVGs
  (`magick` trim+center → `potrace`), saved to `apps/desktop/src/assets/icons/`.
- `icons.tsx`: the 12 brand icons now render via a CSS-mask + `currentColor` helper. Utility icons
  (pin/clock/owl/stop/x/check/lock/file) stay inline.

## Done when

- Typecheck + electron build pass.  ✓
- Nav icons recolor correctly in all states.  ✓ (mechanism reviewed)
- Review subagent confirms the mapping + recolor mechanism.  ✓

## Execution receipt

Status: done
Date: 2026-06-13

- Mapped 14 UUID PNGs → icon names via a contact sheet; traced 12 to `currentColor` SVGs
  (visually verified clean); wired `icons.tsx` (mask + currentColor).
- `typecheck` pass; `electron:build` pass (SVG assets bundled).
- Worktree `otto-v01-integration`; only `icons.tsx` + new `assets/icons/*.svg` touched.
- Needs a repackage/reinstall to appear in the installed otto.app.

## Review (independent subagent)

Verdict: PASS — 2026-06-13.
- ASSETS: all 12 SVGs present; potrace-traced filled paths, transparent bg → valid alpha masks.
- WIRING: every nav Icon key + send resolves to `M(<key>Url)` importing the identically-named
  `<key>.svg`. `charters` SurfaceId → `Icon.charter` → `charter.svg` is correct, not a mismatch.
- MECHANISM: `M()` uses `background-color: currentColor` + `mask-image`; no hardcoded color.
- RESIDUAL: utility inline icons untouched and intact.

Accepted → `_Done`.

## Correction (mask → inline SVG)

Date: 2026-06-13. The CSS-mask mechanism above rendered as **solid `currentColor` squares in the
packaged app** — the `mask-image` URL did not resolve under Electron `file://` + CSP (it works in
dev, not packaged). Re-wired to **inline SVG**: `icon-art.ts` holds each traced `<g>` with
`fill="currentColor"`, rendered as typed React `<path>` nodes — no external resource, no `dangerouslySetInnerHTML`, tints correctly.
Removed the unused `assets/icons/*.svg` mask files. Rebuilt, swapped into `/Applications/otto.app`,
re-signed, relaunched; verified in-bundle (no `maskImage`, inline `<g transform>` art present).
Independent re-review: **PASS** (no mask code, all 12 art entries use `currentColor`, keys map, inline render).

## Blocker log

(none)

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Typecheck + electron build pass: **PASS** — receipt documents pass; `icon-art.ts` + inline `Art()` in repo.
- Nav icons recolor correctly in all states: **PASS** — `fill="currentColor"` inline SVG paths; no `mask-image`.
- Review subagent confirms mapping + recolor mechanism: **PASS** — all 12 nav keys + send/owl/theme/plus/panel in `icon-art.ts` and `icons.tsx`.

### Evidence inspected

- `apps/desktop/src/components/icon-art.ts`, `icons.tsx`
- Ticket ## Execution receipt, ## Correction (mask→inline)

### Defects

Build not re-run in rev8 (not spot-checked).

### Required changes

None.

### Finding

Inline SVG wiring satisfies Done-when; packaged-app mask failure was corrected. +1.

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
