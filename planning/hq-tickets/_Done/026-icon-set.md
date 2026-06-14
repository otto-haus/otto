# 026 — Icon set (craft)

Owner: Claude
Priority: P1
Depends on: Brand Style Guide
Release bucket: later-generated

## Outcome

A prompt + generated PNG for **every** otto surface icon — Chat, Charters, Standards, Practices,
Routines, Curation, Receipts, Autonomy, Settings, Home/owl, New chat, Sidebar toggle, Theme, Send.

## Scope

- Every otto nav + utility icon has its own prompt in `otto-icon-prompts.md`.
- Consistent line language; owl-eye motif; funnel curation; owl-with-ear-tufts home.
- Canonical output = the gpt-image-2 PNG set (`iconography/`).

## Done when

- Every otto surface icon has a prompt AND a generated PNG.  ✓ (14/14 in `iconography/`)
- Silhouette-distinct at 16px.  ✓
- Review subagent passes the prompt pack against the brand guide.  ✓

## Execution receipt

Status: done
Date: 2026-06-13

- Prompt pack `otto-icon-prompts.md` covers all 14 surfaces (Desktop symlink).
- All 14 PNGs generated and saved to
  `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/iconography/`.
- The 12 nav/utility icons traced and wired into the desktop app — see ticket **030** (Done).
- SVGs are reference-only (archived); PNGs are canonical, per Sebastian.

## Review (prompt pack — independent subagent)

Verdict: PASS — 2026-06-13. Full coverage (9 nav + Home/owl + 4 utility); on-brand (hairline
ink-on-white, owl-eye = single ring + dot, no decoration); silhouettes disambiguated; PNG canonical.
No must-fix.

## Blocker log

(none) — the archived SVG path is intentional, not a defect.
