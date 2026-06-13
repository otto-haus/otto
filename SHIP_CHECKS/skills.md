# Ship Check — Skills

## Spec promise

Skills are reusable capability/context packages an agent loads to do a kind of work.

## Required file contract

- [x] Core Otto skill exists.
  - Evidence: `skill/SKILL.md` (217 lines)
  - Contents: Charter skill with full workflow, object model (Intent → Charter → State → Receipt), subcommands, gates, runtime structure, and operational rules.

- [x] Routine skill exists if claimed.
  - Evidence: `skill/routine/SKILL.md` (105 lines)
  - Contents: Routine spec, core rule, contract mapping to types.ts, subcommands, pruning test, gates overlay.

- [x] Skill docs include triggers, workflow, constraints, and outputs.
  - Evidence:
    - Charter SKILL.md frontmatter: `description: Charter — an operating contract system... Use when the user invokes /charter or /goal, says they want to start/track/resume long-running work...`
    - Routine SKILL.md frontmatter: `description: Routine — repeated bundles of Practices. Use when the user invokes /routine, wants recurring agent behavior...`
    - Charter workflow fully documented: Intent → Charter → State → Receipt, with subcommands (propose/approve/status/step/update/receipt/block/audit/sharpen/split/complete/cancel).
    - Routine workflow fully documented: list/show/run/pause/resume/propose/mine/receipt/gates.
    - Constraints documented: Charter gates, approval floor, no-evidence-loops, AC-by-AC proof mapping; Routine approval gates on recurring activation, Practices-only constraint.
    - Outputs specified: Charter (charter.md, charter.yaml, state.yaml, ledger.md, approvals, receipts, traces, notes); Routine (Runs, Receipts, routine.yaml).

- [x] Install/load instructions exist.
  - Evidence: `scripts/install.sh` (45 lines)
  - Contents: 
    - Step 1: Symlink extensions (charter.ts, routine.ts) into ~/.letta/extensions/
    - Step 2: Copy skills into agent memory dir if MEMORY_DIR set (skill/SKILL.md → memories/skills/charter/, skill/routine/SKILL.md → memories/skills/routine/)
    - Step 3: Scaffold runtime (Charter home under ~/.charter/charters/ with active.json)
    - Clear fallback instructions if MEMORY_DIR not set.

## Required runtime behavior

- [~] Skills can be installed or loaded in Letta Code.
  - Evidence: 
    - Extensions exist and reference skill paths: `extension/charter.ts` (line 7-8: "This single-file Letta Code extension provides: 1. Charter command (/charter, compat alias /goal) 2. Charter Gates")
    - Extension/routine.ts exists (line 12: "/routine command — a thin launcher for the `routine` skill workflow.")
    - Install script is executable and ready to symlink.
  - Gap: Skills are documented/designed for installation but NO EVIDENCE that they have been tested loading into a live Letta Code agent. The install script is a shell script (not integrated into bun build or CI). No test harness verifies that /reload in Letta Code actually picks up these skills or that /charter command works end-to-end with live agent memory.

- [x] Skills point to real repo artifacts and current naming.
  - Evidence:
    - Charter skill references live types in `packages/core/src/types.ts` (defines PracticeSpec, Routine, Run, Receipt, Approval, Charter globals).
    - Routine skill references canonical Practice slugs (charter, decision, review, field-note, follow-up) defined in `practices/<slug>/practice.yaml`.
    - Runtime home variables are correct: Charter uses $CHARTER_HOME (default ~/.charter), Routine uses $ROUTINE_HOME → $OTTO_HOME → $VINNY_HOME → ~/.otto.
    - Naming locked (2026-06-13) in types.ts and v0-contract.md; skills match locked names.

## Required demo

- [x] `demo/out/otto-v01-skills.mp4` shows actual skill files and what they enable.
  - Evidence: `demo/out/otto-v01-skills.mp4` exists, 1.6 MB, ISO Media MP4 format, created 2026-06-13.
  - Limitation: File is a binary video; content cannot be verified in this read-only audit. Assumed to show skill files and charter/routine workflows based on filename and receipt note.

## Required receipt

- [x] `receipts/otto-v01/skills.md` states manual vs automated verification.
  - Evidence: `receipts/otto-v01/skills.md` (9 lines)
  - Contents:
    - What changed: skill/SKILL.md and skill/routine/SKILL.md swept to Otto; runtime docs updated.
    - Demo: demo/out/otto-v01-skills.mp4.
    - Test: "No automated test (skills are markdown workflows). Content verified by read."
    - Manual verification: `ls skill/`; `head skill/SKILL.md` (charter workflow + object model).
    - Known limitations: Only charter + routine skills ship in v0.1; no broader skill catalog.
    - Approval status: ☐ pending Sebastian.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- **Ship in v0.1** (recommended)
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.

