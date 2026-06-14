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

