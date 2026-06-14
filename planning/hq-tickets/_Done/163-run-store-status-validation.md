# 163 - Run store status validation

Owner: Codex
Status: active

## Outcome

Malformed persisted run records cannot appear as successful runs when their status is unknown.

## Critique pass

Feature: `apps/desktop/electron/run-store.ts` file-backed RunStore.

Context7 sources:
- `/microsoft/typescript`: TypeScript interfaces are erased at runtime; persisted JSON requires explicit property checks or user-defined type guards.

Exa: unavailable in this Codex tool context; design judgment uses Context7 plus repo evidence.

Key design decisions:
- Right: `RunStore.list()` isolates bad run files by counting skipped records instead of crashing the Runs surface.
- Right: `RunStore.record()` creates new run summaries with a conservative default status of `running`.
- Wrong: persisted run records with unknown status are normalized to `success`.
- Wrong: the only legacy compatibility path is `completed -> success`; treating every other unknown value as success overstates proof.

## Rebuild

Add a regression test for a persisted run JSON with an invalid status, confirm it currently appears as `success`, then reject unknown persisted statuses while keeping the `completed -> success` legacy mapping.

## Done when

- A focused failing test proves an unknown persisted run status currently loads as `success`.
- `RunStore.list()` skips run records with unknown status values.
- Legacy `completed` run status still loads as `success`.
- Existing run recording/listing behavior remains intact.
- Verification receipt lists focused tests, typechecks, diff checks, whitespace scan, and staging result or reason not run.
- Independent reviewer appends `Verdict: +1` before this ticket moves to `_Done`.

## Execution receipt

Status: pass
Date: 2026-06-14T16:22:20Z

## What changed

- Added focused RunStore tests for normal recording/listing, unknown persisted status handling, and legacy `completed -> success` compatibility.
- Changed persisted run status normalization so unknown statuses are skipped instead of becoming `success`.

## Files changed

- `apps/desktop/electron/run-store.ts`
- `apps/desktop/electron/run-store.test.ts`
- `planning/hq-tickets/163-run-store-status-validation.md`

## Verification run

- Red first: `bun test apps/desktop/electron/run-store.test.ts` failed after the regression was added.
  - Failure: persisted `status: "done"` loaded as `status: "success"`.
- `bun install` passed.
- Focused test: `bun test apps/desktop/electron/run-store.test.ts` passed.
  - 3 pass, 0 fail, 10 expect calls.
- Scoped consumer tests: `bun test apps/desktop/electron/run-store.test.ts apps/desktop/electron/practice-runner.test.ts apps/desktop/electron/worker-runner.test.ts apps/desktop/electron/ticket-orchestrator.test.ts` passed.
  - 13 pass, 0 fail, 49 expect calls.
- Full tests: `bun test` passed.
  - 217 pass, 1 skip, 0 fail, 726 expect calls.
- Root typecheck: `bun run typecheck` passed.
- Desktop renderer typecheck: `bun run --cwd apps/desktop typecheck` passed.
- Desktop Electron typecheck: `bun run --cwd apps/desktop electron:typecheck` passed.
- v0 gate: `bun run verify:v0` passed.
  - 5 passed, 0 failed.
- Staging: `task staging` passed.
  - staging app: `/Applications/otto-staging.app`
  - isolated home: `/Users/seb/.codex/admin/otto-staging/home`
  - isolated otto home: `/Users/seb/.codex/admin/otto-staging/otto-home`
  - isolated profile: `/Users/seb/.codex/admin/otto-staging/profile`
  - port: `9445`
- Diff whitespace: `git diff --check -- apps/desktop/electron/run-store.ts apps/desktop/electron/run-store.test.ts planning/hq-tickets/163-run-store-status-validation.md` passed.
- Untracked ticket whitespace scan: `rg -n "[[:blank:]]$" apps/desktop/electron/run-store.ts apps/desktop/electron/run-store.test.ts planning/hq-tickets/163-run-store-status-validation.md` returned no matches.

## Evidence

- Context7 `/microsoft/typescript`: TypeScript interfaces are erased at runtime; parsed file records need explicit property checks/type guards.
- Generated `apps/desktop/src/data/readiness.json` and `knowledge/_receipts/knowledge-update-2026-06-14.md` changes from staging/tests were restored and are excluded from the scoped diff.

## Known limitations

- This ticket validates run status only. It does not add a full RunSummary schema validator.

Reviewer verdict: pending

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14T16:45:00Z
Verdict: +1

### Checked against

- Unknown persisted status regression: proven by receipt red-first failure note and covered by `run-store.test.ts`.
- `RunStore.list()` skips unknown statuses: current test passes and code returns `null` for unknown normalized status.
- Legacy `completed` maps to `success`: current test passes and `status()` keeps the compatibility branch.
- Existing record/list behavior remains intact: current test covers normal record/list path and default code path remains `running`.
- Verification receipt: lists focused/scoped/full tests, typechecks, `verify:v0`, staging, diff whitespace, and untracked whitespace scan.
- Generated readiness/knowledge noise: current status contains only run-store source, run-store test, and this ticket file.

### Evidence inspected

- Files: `apps/desktop/electron/run-store.ts`, `apps/desktop/electron/run-store.test.ts`, this ticket.
- Commands: `git status --short`; `git diff -- apps/desktop/electron/run-store.ts`; `git diff --no-index -- /dev/null apps/desktop/electron/run-store.test.ts`; `git diff --check -- apps/desktop/electron/run-store.ts`; `bun test apps/desktop/electron/run-store.test.ts`.
- UI/artifacts: staging proof inspected from execution receipt; no UI-specific behavior in scope.
- Git diff: narrow to intended run-store source/test plus ticket; no readiness JSON or knowledge receipt in current diff/status.

### Passes

All Done-when items are satisfied.

### Defects

None.

### Required changes

None.

### Optional polish

None.

### Finding

The patch prevents malformed persisted run statuses from being treated as successful proof while preserving the documented `completed -> success` legacy mapping.

### Final call needed from Sebastian

Ticket may move to `_Done`.
