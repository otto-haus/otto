# 160 - Practice spec required scalar validation

Owner: Codex
Status: active

## Outcome

Malformed `practices/<slug>/practice.yaml` files cannot pass validation when required scalar identity fields are missing or blank.

## Critique pass

Feature: `packages/practices` PracticeSpec loader and validator.

Context7 sources:
- `/eemeli/yaml`: `YAML.parse` returns native JavaScript matching the root YAML value, including scalars, arrays, nulls, and objects; loaders must inspect the parsed shape before treating it as a config object.
- `/microsoft/typescript`: Type assertions are compile-time only and do not perform runtime casts or validation.

Exa: unavailable in this Codex tool context; design judgment uses Context7 plus repo evidence.

Key design decisions:
- Right: Parse YAML as `unknown` first and reject non-object roots before constructing a PracticeSpec. This matches the YAML parser contract and keeps scalar YAML from entering the validator as a spec.
- Right: Centralize approval wording normalization in the loader, then let the validator enforce the canonical approval floor.
- Wrong: The validator only checks arrays, slug, status, and approval floor. It never checks `name`, `version`, `summary`, or `owner`, so a spec missing core identity fields can validate.
- Wrong: The loader coerces `version` with `String(parsed.version)`, which turns a missing version into `"undefined"` and makes the missing-field bug harder to see.

## Rebuild

Add a regression test that proves required scalar fields are rejected, then tighten the validator and loader so missing fields remain invalid instead of being stringified into plausible data.

## Done when

- A focused failing test proves a spec missing required scalar fields is currently accepted.
- `validatePracticeSpec` rejects blank or missing `name`, `version`, `summary`, and `owner`.
- `loadPracticeSpec` no longer converts a missing `version` into `"undefined"`.
- Existing valid practice specs still validate.
- Verification receipt lists focused tests, typechecks, diff checks, and whitespace scan.
- Independent reviewer appends `Verdict: +1` before this ticket moves to `_Done`.

## Execution receipt

Status: pass
Date: 2026-06-14T15:36:35Z

## What changed

- Added regression coverage for missing required scalar fields in PracticeSpec validation.
- Added regression coverage proving `loadPracticeSpec` must not stringify a missing `version` into `"undefined"`.
- Updated `validatePracticeSpec` to require non-empty `name`, `version`, `summary`, and `owner`.
- Updated `loadPracticeSpec` to normalize only present string/number versions, preserving missing/null/object values for validation.

## Files changed

- `packages/practices/src/load.ts`
- `packages/practices/src/validate.ts`
- `packages/practices/test/validate.test.ts`
- `planning/hq-tickets/160-practice-spec-required-scalar-validation.md`

## Verification run

- Red first: `bun test packages/practices/test/validate.test.ts` failed after the regression test was added.
  - Failure 1: expected `name must be present and non-empty`; received `[]`.
  - Failure 2: expected missing loaded `version`; received `"undefined"`.
- Green focused: `bun test packages/practices/test/validate.test.ts` passed.
  - 8 pass, 0 fail, 13 expect calls.
- Full tests: `bun test` passed.
  - 190 pass, 1 skip, 0 fail, 607 expect calls.
- Root typecheck: `bun run typecheck` passed.
- Desktop renderer typecheck: `bun run --cwd apps/desktop typecheck` passed.
- Desktop Electron typecheck: `bun run --cwd apps/desktop electron:typecheck` passed.
- Diff whitespace: `git diff --check -- packages/practices/src/load.ts packages/practices/src/validate.ts packages/practices/test/validate.test.ts planning/hq-tickets/160-practice-spec-required-scalar-validation.md` passed.
- Untracked ticket whitespace scan: `rg -n "[[:blank:]]$" packages/practices/src/load.ts packages/practices/src/validate.ts packages/practices/test/validate.test.ts planning/hq-tickets/160-practice-spec-required-scalar-validation.md` returned no matches.

## Evidence

- Context7 `/eemeli/yaml`: `YAML.parse` returns native JavaScript according to the YAML root value; parsed config needs runtime shape checks.
- Context7 `/microsoft/typescript`: type assertions do not cast or validate at runtime.
- `bun install` was run first because the clean worktree initially could not resolve `yaml`.
- Generated test-writeback noise in `knowledge/_receipts/knowledge-update-2026-06-14.md`, `knowledge/ai-frontier/capability-notes.md`, and `standards/standards/quality.md` was restored and is excluded from the scoped diff.
- Staging was not run because this ticket changed only `packages/practices` and its ticket file; no `apps/desktop/` implementation files changed.

## Known limitations

- This does not add a full schema parser. It tightens the existing validator and loader pattern only for the missing scalar-field defect.

Reviewer verdict: pending

## Review

Reviewer: goal_judge Architect (`019ec6c7-957d-7113-8fa1-7caf593c678e`)
Date: 2026-06-14T15:41:00Z
Verdict: +1

Note: independent judge returned this verdict but could not append directly because its runtime enforced a stricter read-only contract. PM transcribed the verdict and evidence without changing the substance.

### Checked against

- Done when item 1: pass. Ticket receipt records the red focused test proving missing scalar fields were accepted and missing `version` became `"undefined"`.
- Done when item 2: pass. `packages/practices/src/validate.ts` validates `name`, `version`, `summary`, and `owner` as required non-empty strings.
- Done when item 3: pass. `packages/practices/src/load.ts` only normalizes present string/number versions and preserves missing values for validation.
- Done when item 4: pass. Focused and full test receipts show existing valid practice specs still validate.
- Done when item 5: pass. Receipt lists focused tests, full tests, typechecks, diff check, and whitespace scan.
- Done when item 6: pass. Independent judge verdict is `+1`.

### Evidence inspected

- Files: `packages/practices/src/load.ts`, `packages/practices/src/validate.ts`, `packages/practices/test/validate.test.ts`, this ticket.
- Commands: receipt-recorded `bun test packages/practices/test/validate.test.ts`, `bun test`, `bun run typecheck`, `bun run --cwd apps/desktop typecheck`, `bun run --cwd apps/desktop electron:typecheck`, `git diff --check`, and trailing-whitespace scan.
- UI/artifacts: not applicable; no app UI files changed.
- Git diff: only intended practice source/test files plus this ticket; generated knowledge/standards writeback noise absent from current diff.

### Passes

- Required scalar fields now have runtime validation instead of relying on erased TypeScript types.
- Loader compatibility for numeric YAML versions is preserved without hiding absent versions.
- Scope stayed inside the practice loader/validator feature and ticket proof.

### Defects

- None.

### Required changes

- None.

### Optional polish

- A future schema parser could make the full PracticeSpec contract more explicit, but this ticket correctly fixes the bounded defect.

### Finding

The implementation satisfies the ticket and may move to `_Done`.

### Final call needed from Sebastian

- None.
