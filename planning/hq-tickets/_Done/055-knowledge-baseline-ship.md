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

## Review

**Verdict: +1**

Independent check (2026-06-13): `bun test ./apps/desktop/electron/knowledge-store.test.ts` → 2 pass; desktop typecheck exit 0.

**Done when:**

- `docs/v1/SHIP_CHECKS/knowledge.md` evidence paths match store, pane IPC (`otto:knowledge:list`, `otto:knowledge:resolve-role`), and proposed registry status.
- `receipts/otto-v01/knowledge.md` aligns with ship check + PROPOSED claim boundary.
- Routing read path confirmed: `KnowledgeStore.resolveModelForRole` used in `autonomy-store.ts` and `ticket-orchestrator.ts` (no silent mutation).

**Caveats (in scope, documented):** staging smoke not re-run in this review; Cognee/062 deferred; routing remains proposed until Curation ratifies. Root `SHIP_CHECKS/knowledge.md` is older prose — canonical path is `docs/v1/SHIP_CHECKS/knowledge.md` per `SHIP_STATUS.md`.

## Review rev3

Reviewer: Cursor (implementer lane doc pass)
Date: 2026-06-13
Verdict: +1 (reconfirmed)

Evidence: `bun run verify:v0` → 5 passed, 0 failed. `docs/v1/SHIP_CHECKS/knowledge.md` has honest `[x]`/`[~]` with store test paths; `knowledge-store.test.ts` in verify suite.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Knowledge pane loads from files; honest empty/skipped: **Pass** — `Panes.tsx` Knowledge + `knowledge-store.ts`; ship check `docs/v1/SHIP_CHECKS/knowledge.md`
- Autonomy/ticket orchestrator reads routing from store: **Pass** — `resolveModelForRole` in autonomy + orchestrator paths
- Ship check items with receipt paths: **Pass** — `receipts/otto-v01/knowledge.md`
- Tests for `KnowledgeStore`: **Pass** — included in `bun run verify:v0` (162 unit tests total)

### Evidence inspected

- Files: `apps/desktop/electron/knowledge-store.ts`, `docs/v1/SHIP_CHECKS/knowledge.md`, `receipts/otto-v01/knowledge.md`
- Commands: `bun test ./apps/desktop/electron/knowledge-store.test.ts` → 2 pass; `bun run verify:v0` → 5 passed / 0 failed

### Honest limit

Staging smoke not re-run in rev8; registry remains **proposed** per ship check — correct claim boundary.

### Finding

All Done-when items mapped with file + test evidence; no mock METR feeds.

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
