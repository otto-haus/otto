# 162 - Receipt timestamp validation

Owner: Codex
Status: active

## Outcome

Malformed receipt JSON files with invalid timestamps are excluded from the receipt index instead of appearing as valid proof records with broken ordering.

## Critique pass

Feature: `apps/desktop/electron/receipt-store.ts` receipt listing and detail normalization.

Context7 sources:
- `/nodejs/node`: invalid date strings parsed by `Date.parse()` return `NaN`; valid date parsing returns epoch milliseconds.
- `/microsoft/typescript`: type assertions do not perform runtime validation.

Exa: unavailable in this Codex tool context; design judgment uses Context7 plus repo evidence.

Key design decisions:
- Right: Receipt listing catches unreadable or malformed JSON and increments `skipped` instead of crashing the proof surface.
- Right: Receipt normalization checks the schema, status, subject, result summary, evidence shape, and blocker shape before surfacing a record.
- Wrong: Any timestamp string is accepted even though the core receipt contract defines `timestamp: ISO8601`.
- Wrong: Invalid timestamps are converted to sort value `0`, which hides malformed proof records instead of rejecting them.

## Rebuild

Add a regression test for a schema-valid receipt with an invalid timestamp, confirm it currently appears in the index, then reject invalid timestamps during normalization.

## Done when

- A focused failing test proves invalid timestamp strings are currently listed as receipts.
- `ReceiptStore.list()` skips receipts whose `timestamp` cannot be parsed as a finite date.
- `ReceiptStore.get(id)` returns `null` for a receipt with an invalid timestamp.
- Existing valid receipt listing/detail behavior still passes.
- Verification receipt lists focused tests, typechecks, diff checks, whitespace scan, and staging result or reason not run.
- Independent reviewer appends `Verdict: +1` before this ticket moves to `_Done`.

## Execution receipt

Status: partial
Date: 2026-06-14T16:16:04Z

## What changed

- Added regression coverage for an otherwise valid receipt JSON with `timestamp: "not-a-date"`.
- Added receipt timestamp validation in `normalizeReceipt` so invalid timestamps are skipped by both `list()` and `get(id)`.

## Files changed

- `apps/desktop/electron/receipt-store.ts`
- `apps/desktop/electron/receipt-store.test.ts`
- `planning/hq-tickets/162-receipt-timestamp-validation.md`

## Verification run

- Red first: `bun test apps/desktop/electron/receipt-store.test.ts` failed after the regression was added.
  - Failure: `receipt-bad-time` appeared in `list().receipts` with `timestamp: "not-a-date"`.
- `bun install` passed.
- Focused test: `bun test apps/desktop/electron/receipt-store.test.ts` passed.
  - 3 pass, 0 fail, 12 expect calls.
- Scoped consumer tests: `bun test apps/desktop/electron/receipt-store.test.ts apps/desktop/electron/behavior-changelog.test.ts apps/desktop/electron/check-runner.test.ts apps/desktop/electron/proposal-store.test.ts` passed.
  - 22 pass, 0 fail, 118 expect calls.
- Root typecheck: `bun run typecheck` passed.
- Desktop renderer typecheck: `bun run --cwd apps/desktop typecheck` passed after `bun install`.
- Desktop Electron typecheck: `bun run --cwd apps/desktop electron:typecheck` passed after `bun install`.
- Full tests: `bun test` failed on an unrelated clean-base Cognee assertion.
  - Failing test: `apps/desktop/electron/cognee-store.test.ts` -> `CogneeStore helpers > recall smoke returns path-backed citations when ready and capture receipt exists`.
  - Failure: expected first citation path to contain `receipts`; received `standards/precedents/foo.md`.
  - Related open PR exists: #29 `fix(desktop): stabilize cognee recall captures`.
- v0 gate: `bun run verify:v0` failed because it runs the same full `bun test` suite and hit the same unrelated Cognee assertion.
- Staging: `task staging` passed.
  - staging app: `/Applications/otto-staging.app`
  - isolated home: `/Users/seb/.codex/admin/otto-staging/home`
  - isolated otto home: `/Users/seb/.codex/admin/otto-staging/otto-home`
  - isolated profile: `/Users/seb/.codex/admin/otto-staging/profile`
  - port: `9445`
- Diff whitespace: `git diff --check -- apps/desktop/electron/receipt-store.ts apps/desktop/electron/receipt-store.test.ts planning/hq-tickets/162-receipt-timestamp-validation.md` passed.
- Untracked ticket whitespace scan: `rg -n "[[:blank:]]$" apps/desktop/electron/receipt-store.ts apps/desktop/electron/receipt-store.test.ts planning/hq-tickets/162-receipt-timestamp-validation.md` returned no matches.

## Evidence

- Context7 `/nodejs/node`: invalid date parsing returns `NaN`; finite epoch milliseconds indicate valid parsed dates.
- Context7 `/microsoft/typescript`: type assertions do not perform runtime validation; parsed JSON needs explicit property checks/type guards.
- Generated `apps/desktop/src/data/readiness.json` and `knowledge/_receipts/knowledge-update-2026-06-14.md` changes from staging/tests were restored and are excluded from the scoped diff.

## Known limitations

- The full test suite is blocked by an unrelated clean-base Cognee citation-order assertion. This ticket does not touch Cognee code.

Reviewer verdict: pending

## Review

Reviewer: goal_judge Reviewer (`019ec6eb-ebbe-7783-b010-77e6aa347ab8`)
Date: 2026-06-14T16:27:00Z
Verdict: +1

Note: independent judge returned this verdict but could not append directly because its runtime enforced a stricter read-only contract. PM transcribed the verdict and evidence without changing the substance.

### Checked against

- Done when item 1: pass. Red-first focused test showed `receipt-bad-time` was listed with `timestamp: "not-a-date"`.
- Done when item 2: pass. `ReceiptStore.list()` now skips invalid parsed timestamps through `normalizeReceipt`.
- Done when item 3: pass. Regression asserts `ReceiptStore.get('receipt-bad-time')` returns `null`.
- Done when item 4: pass. Existing valid receipt listing/detail tests still pass.
- Done when item 5: pass. Receipt lists focused tests, scoped consumer tests, typechecks, diff checks, whitespace scan, staging, and the unrelated full-suite Cognee blocker.
- Done when item 6: pass. Independent judge verdict is `+1`.

### Evidence inspected

- Files: `apps/desktop/electron/receipt-store.ts`, `apps/desktop/electron/receipt-store.test.ts`, this ticket.
- Commands: focused receipt test, scoped consumer tests, root typecheck, desktop typecheck, electron typecheck, diff check, whitespace scan, staging.
- UI/artifacts: `/Applications/otto-staging.app` launched with isolated staging home/profile.
- Git diff: only intended receipt-store source/test files plus this ticket; generated readiness/knowledge files absent.

### Passes

- Invalid receipt timestamps are rejected by the shared receipt normalizer used by both `list()` and `get()`.
- The slice stayed scoped to the receipt store and proof ticket.
- The unrelated Cognee full-suite failure is separate and has an existing open PR (#29).

### Defects

- None for this ticket.

### Required changes

- None.

### Optional polish

- Future receipt validation could enforce a stricter ISO-8601 regex, but finite parsed timestamp validation fixes this ticket's defect.

### Finding

The implementation satisfies the scoped ticket and may move to `_Done`.

### Final call needed from Sebastian

- None.
