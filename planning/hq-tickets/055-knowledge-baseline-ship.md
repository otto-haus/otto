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
