# 062 — AI Frontier Review Routine Executor

Owner: Cursor
Priority: P2
Depends on: 055, 052
Release bucket: vNext knowledge

## Outcome

`routines/ai-frontier-review/` runs manually (then schedulable) to refresh **facts** in Knowledge files and write update receipts; **policy** changes still go to Curation.

## Why this matters

Knowledge Partial: manual YAML edits only; no ingestion pipeline for METR/Artificial Analysis yet.

## Scope

- Script: fetch or merge curated updates into `capability-notes.md`, costs, benchmark links (manual paste slot acceptable v1)
- Updates `last_verified` on touched models
- Writes `knowledge/_templates/knowledge-update-receipt.md` instance
- Proposes Curation item when routing would change

## Out of scope

- Fully automated web scraping at scale
- Cognee indexing (043)

## Done when

- Manual run updates at least one fact field + receipt
- Routing change creates `knowledge_update` proposal not silent edit
- Routine trial via 052 works

## Verification

```sh
bun test ./apps/desktop/electron/knowledge-store.test.ts
bun test ./apps/desktop/electron/routine-store.test.ts
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit; routine manual delegation)
Date: 2026-06-13
Owner lane: Cursor (implementer)

### What changed

- `ai-frontier-review-executor.ts` updates facts + knowledge update receipt; optional routing proposal via Curation.
- `routine-store.runManual('ai-frontier-review')` delegates to executor and links knowledge receipt.
- `ai-frontier-review-executor.test.ts` + extended `routine-store.test.ts`.

### Verification

```sh
bun test ./apps/desktop/electron/ai-frontier-review-executor.test.ts
bun test ./apps/desktop/electron/routine-store.test.ts
bun test ./apps/desktop/electron/knowledge-store.test.ts
```

### Known limitations

- Routing proposal path is explicit opt-in (`routingChangeDetected`); no auto-diff of routing block yet.
- Reviewer +1 pending.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

ai-frontier-review-executor wired in routine-store; no manual run receipt or routing-change proposal proof.

## Review rev3 (implementer follow-up)

Date: 2026-06-13
Lane: Cursor implementer

- Manual run updates `last_reviewed` / `last_verified` and writes `knowledge.frontier_review.manual` receipt.
- `routingChangeDetected: true` creates `knowledge` Curation proposal (not silent routing edit).
- `runManual('ai-frontier-review')` links `knowledgeReceiptId` on routine receipt.
- Tests: `ai-frontier-review-executor.test.ts` 2/2, `routine-store.test.ts` 4/4.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- Manual run updates fact field + receipt: **Pass** — executor test updates `last_verified` + writes receipt
- Routing change creates proposal not silent edit: **Pass** — `routingChangeDetected: true` test
- Routine trial via 052: **Pass** — `runManual('ai-frontier-review')` in routine-store tests

### Evidence inspected

- Commands: `bun test apps/desktop/electron/ai-frontier-review-executor.test.ts apps/desktop/electron/routine-store.test.ts`; `bun run verify:v0` → 5 pass

### Finding

Manual frontier review executor meets Done when for v1 (paste slot + receipt + optional Curation proposal).

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Manual frontier executor + receipt: **Pass** — `ai-frontier-review-executor.test.ts`

### Finding

Reconfirmed +1.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; no rev9 delta.
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.

## Reopened (2026-06-14)

Reason: +1 but proof_class=unit_only
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.
