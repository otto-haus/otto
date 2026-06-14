# 027 — Motion spec (Brand Style Guide §09)

Owner: Claude
Priority: P1
Depends on: Brand Style Guide
Release bucket: later-generated

## Outcome

The brand guide's missing motion chapter, in brand voice, as a clean drop-in §09.

## Why this matters

Motion was the one undocumented surface in an otherwise complete guide. Codifying it keeps
animation calm and exact — and on-brand — as the desktop app grows.

## Scope

- §09 Motion added to `Brand Style Guide.html` (TOC link + section), **zero new CSS** —
  reuses existing classes (principles, numerals, spec-grid, dodont, motif-note).
- Duration scale 0 / 120 / 180 / 240ms; one shared ease-out (no spring/overshoot);
  reduced-motion; status cross-fade (never blink); emphasis rationed to the ink block.
- Standalone copy kept at `otto-motion-section.html`.

## Done when

- §09 renders using only existing classes; TOC active-state highlighting works.
- Voice matches the guide; no forbidden claims; nothing contradicts existing sections.
- Review subagent passes.

## Execution receipt

Status: done
Date: 2026-06-13

- Inserted §09 Motion before the footer; added the TOC link.
- Verified all classes used by §09 already exist in the guide's `<style>` (zero new CSS).
- Section count 9; TOC link present; `id="motion"` present once.

## Review (independent subagent)

Verdict: PASS — 2026-06-13

- CLASSES: every class used in §09 is defined in the guide's `<style>` (no unstyled output).
- VOICE: calm/exact register held; forbidden words ("set it and forget it", "magical") appear
  only as quoted bans, mirroring §01.
- CONSISTENCY: durations 0/120/180/240ms, nothing exceeds 240ms; easing `0.2,0,0,1` / `0.4,0,1,1`
  are overshoot-free; aligns with the status-hue-only and once-per-arc rules.
- WIRING: TOC `href="#motion"` present; `id="motion"` once; section number 09.

Accepted → `_Done`.

## Blocker log

(none)

## Review

Reviewer: Codex
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1: Pass. `Brand Style Guide.html` has one `id="motion"`, one `href="#motion"`, nine guide sections, matching TOC links, existing-class coverage for every class used in the motion section, and Chrome runtime proof that scrolling to `#motion` marks the Motion TOC link active.
- Done when item 2: Fail on scope exactness. Voice, render, standalone copy, and forbidden-claim checks pass, but the section contradicts the ticket scope requirement for one shared ease-out by defining a second exit easing token.
- Done when item 3: Fail. Review subagent does not pass until the easing-token mismatch is corrected or the ticket scope is amended.

### Evidence inspected

- Files: `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Brand Style Guide.html`; `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/otto-motion-section.html`
- Commands: `grep -c 'id="motion"'`; `grep -c 'href="#motion"'`; `rg` over motion/TOC/claim terms; Python class/TOC/standalone comparison checks; Playwright Chrome screenshot and runtime active-link check.
- UI/artifacts: `/tmp/otto-ticket-027-motion-crop.png` shows Section 09 rendering with the guide layout; Playwright runtime returned `activeText:"Motion"` and `activeHref:"#motion"` after scrolling to `#motion`.
- Git diff: Not applicable; reviewed Dropbox artifacts named by the ticket, not repo code.

### Passes

- The motion section is present before the footer and is numbered 09.
- The TOC includes Motion and matches the guide section ids exactly.
- The active-state script covers all `.toc a` links and worked in Chrome after scrolling to the Motion section.
- The motion section uses stylesheet-defined classes only; no missing class definitions were found.
- The standalone drop-in section semantically matches the embedded section after ignoring comments and whitespace.
- The content includes the requested 0ms, 120ms, 180ms, and 240ms duration scale; reduced-motion guidance; status cross-fade / never blink guidance; and emphasis rationing to the ratification/ink-block moment.
- Forbidden terms appear only as explicit banned examples or rejections, not affirmative product claims.

### Defects

- `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Brand Style Guide.html` defines two easing tokens in Section 09: `Ease - standard` and `Ease - exit`. The surrounding copy says "one curve in, one curve out." The ticket scope requires one shared ease-out. This is a content/spec mismatch, not a render problem.

### Required changes

- Make Section 09 match the ticket's one-shared-ease-out requirement by removing the extra exit-ease token and revising the duration/easing copy accordingly, or get Sebastian to amend the ticket scope to allow two easing curves.
- Re-run the narrow checks for `id="motion"`, `href="#motion"`, class reuse, standalone-section match, and TOC active state.

### Optional polish

- None.

### Finding

- The work is close, but `+1` would certify a motion-token rule that contradicts the ticket's own scope.

### Final call needed from Sebastian

- Only needed if Sebastian wants the guide to keep a separate exit easing curve; otherwise this is a straightforward ticket correction.

## Correction (addresses Codex -1)

Status: re-submitted
Date: 2026-06-13

Collapsed §09 to **one shared ease-out**, matching the ticket scope. Removed the `Ease — exit`
token from the duration/easing grid and revised the copy to "one ease-out for everything, no spring
anywhere." Applied to both `Brand Style Guide.html` and `otto-motion-section.html`. The one-curve
rule no longer contradicts the scope. Re-submitted for review.

## Re-review (independent subagent — after correction)

Verdict: PASS — 2026-06-13.
- EASING: exactly one easing token (`0.2, 0, 0, 1`, ease-out, no spring); copy "one ease-out for
  everything"; the `Ease — exit` token and "one curve in, one curve out" phrasing are gone. -1 resolved.
- DURATIONS: 0/120/180/240ms intact; nothing exceeds 240ms; no-spring consistent.
- CLASSES: all defined in `<style>`; numerals grid renders cleanly with 5 cells.
- VOICE/WIRING: calm/exact; no forbidden claims; TOC `href="#motion"`, `id="motion"` once, section 09.
- STANDALONE: `otto-motion-section.html` matches the in-guide §09.

Accepted → _Done.
