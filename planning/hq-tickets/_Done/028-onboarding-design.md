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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Every step has goal / surface / copy / states: **PASS** — Steps 0–3 in Dropbox `otto-onboarding.md`.
- No forbidden claims; lexicon respected: **PASS** — authority line verbatim; banned terms in explicit ban list only.
- Review subagent passes: **PASS** — structure and anti-fake-done model verified.

### Evidence inspected

- Dropbox `otto-onboarding.md` (6678 bytes)
- Ticket ## Execution receipt, ## Review

### Defects

Design doc not in repo (Dropbox-only); acceptable for design-only ticket.

### Required changes

None.

### Finding

Design doc satisfies all Done-when items. +1.

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
