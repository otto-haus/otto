# 055 — Knowledge Baseline Ship (Contract + Surface)

Owner: Cursor
Priority: P1
Depends on: 054, 017
Release bucket: v0.1 knowledge

## Outcome

Knowledge moves from "files in repo" to **formal shipped surface**: `KnowledgeStore`, desktop pane, autonomy routing read path, ship check evidence.

Formalizes work that may exist uncommitted; closes Knowledge one-pager Partial gaps except Cognee (040–044) and ingestion (062).

## Scope

- HQ ticket proof for `knowledge-store.ts` + Knowledge pane
- `model-registry.yaml` routing visible in UI + Autonomy cross-link
- `docs/v1/SHIP_CHECKS/knowledge.md` updated with evidence paths
- Smoke receipt: list registry, show routing status `proposed|active`
- No mock METR/AA feeds

## Out of scope

- Cognee (040–044)
- Automated ingestion (062)

## Done when

- Knowledge pane loads from files with honest empty/skipped states
- Autonomy/ticket orchestrator reads routing from store (existing path verified)
- Ship check items marked with receipt paths
- Tests for `KnowledgeStore`

## Verification

```sh
bun test ./apps/desktop/electron/knowledge-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass  
Date: 2026-06-13

### What changed

Updated `docs/v1/SHIP_CHECKS/knowledge.md` with file + runtime evidence. Refreshed `receipts/otto-v01/knowledge.md` with automated test output. Verified routing read path in `AutonomyStore` and `TicketOrchestrator` via `KnowledgeStore.resolveModelForRole`.

### Evidence paths

- Store: `apps/desktop/electron/knowledge-store.ts`
- Tests: `apps/desktop/electron/knowledge-store.test.ts` (2 pass)
- Pane: `apps/desktop/src/surfaces/Panes.tsx` — Knowledge component
- IPC: `otto:knowledge:list`, `otto:knowledge:resolve-role`
- Canon: `knowledge/ai-frontier/model-registry.yaml` (`status: proposed`)
- Ship check: `docs/v1/SHIP_CHECKS/knowledge.md`
- Receipt: `receipts/otto-v01/knowledge.md`

### Staging smoke notes

- Load: registry + models count + routing assignments table
- Empty/error: missing registry path shows honest fallback notice
- Proposed: status pill + warning when `registry.status === 'proposed'`
- Autonomy cross-link: evaluation shows `knowledge_routing` when classified

### Verification run

```sh
bun test ./apps/desktop/electron/knowledge-store.test.ts  # 2 pass
bun run --cwd apps/desktop typecheck                      # exit 0
```

### Known limitations

- Registry and routing remain **proposed** — public claims must say Proposed until Curation ratifies.
- AI Frontier Review Routine executor not wired (062). Cognee deferred (040–044).

Reviewer verdict: pending
