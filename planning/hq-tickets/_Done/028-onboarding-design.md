# 028 — Onboarding design (craft)

Owner: Claude
Priority: P0
Depends on: Brand Style Guide · §09 Motion (027) · product tickets 001/002/004/005
Release bucket: later-generated

## Outcome

A new operator goes from launch to their first **Receipt** with no fake-done claim anywhere
in the flow.

## Scope

- The 4-step journey: Welcome → Connect (readiness gate) → First loop → First Receipt.
- Exact microcopy obeying the lexicon and forbidden-words list.
- Empty / loading / error / blocked states per step; the ratification gate; motion cues (§09).
- Design doc only (`otto-onboarding.md`); informs product 001/002/004/005. No code.

## Done when

- Every step has goal / surface / copy / states.  ✓
- No forbidden claims; lexicon respected.  ✓
- Review subagent passes.  ✓

## Execution receipt

Status: done
Date: 2026-06-13

- Wrote `otto-onboarding.md` (Desktop symlink). 4 steps with goal/surface/copy/states/gate/motion;
  prove-then-proceed progress model; anti-patterns; success metric; 2 open questions for Sebastian.

## Review (independent subagent)

Verdict: PASS — 2026-06-13.
- FORBIDDEN WORDS: banned terms appear only in the explicit ban list; no claiming usage.
- LEXICON: Receipt/Curation/Approval/Standard/Practice used in-register; authority line verbatim;
  CTAs match canon ("Run one behavior loop", "Inspect a sample Receipt").
- STRUCTURE: 4 steps each carry goal/surface/copy/states + gate + §09-consistent motion timings.
- ANTI-FAKE-DONE: prove-then-proceed; truthful readiness gate; consequential change needs
  Curation/approval before it compounds.

Sebastian follow-up decisions recorded in `otto-onboarding.md`: connect inline through Settings; include a static sample Receipt labeled `sample · not live · not from your workspace`. Accepted → `_Done`.

## Blocker log

(none)
