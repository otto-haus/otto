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
