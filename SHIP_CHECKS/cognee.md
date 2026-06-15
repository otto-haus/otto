# Ship Check — Cognee (derived recall)

## Spec promise

Cognee is an optional **derived relationship graph / recall sidecar** under Knowledge. It indexes Otto file artifacts with provenance and returns cited context packs. It may emit Curation **proposals** only — never mutates canon or Letta memory.

## Required file contract

- [x] `docs/cognee.md` exists with MAY/MUST NOT boundaries.
  - Evidence: `docs/cognee.md` — authority stack, forbidden mutation table, env vars, failure modes.

- [x] `docs/knowledge.md` points at Cognee wave **041–044**, not "never."
  - Evidence: `docs/knowledge.md` — "Deferred in v1 (tracked wave)" section.

- [x] `docs/v3/README.md` status updated to tracked implementation.
  - Evidence: `docs/v3/README.md` — header + link to `docs/cognee.md`.

- [x] Adapter seam mentions Cognee with proposal-only write path.
  - Evidence: `docs/v1/contracts/adapter-seam.md` — "Exemplar: Cognee" section.

- [x] Core types for health + capture receipt.
  - Evidence: `packages/core/src/types.ts` — `CogneeHealth`, `CogneeCaptureReceipt`.

## Required runtime behavior

- [ ] Cognee local home running on loopback.
  - Gap: **041** — not in scope for **040**.

- [ ] MCP recall bridge wired with autonomy gates.
  - Gap: **042**.

- [ ] Capture jobs with provenance receipts.
  - Gap: **043**.

- [~] Knowledge pane graph section.
  - Evidence: `apps/desktop/src/surfaces/Panes.tsx` — `CogneeKnowledgePanel`; `apps/desktop/src/surfaces/cognee-knowledge-panel.test.ts`; `apps/desktop/electron/cognee-store.test.ts` (disabled/stopped/ready recall paths); `docs/receipts/staging/issue-70-cognee-knowledge-20260614.json`
  - Gap: live staging PNG + semantic MCP recall when Cognee daemon + LLM key available (041–043 operator lane).

## Forbidden mutation trace

| Forbidden action | Explicit rule location |
|------------------|------------------------|
| Mutate standards/practices/routines/charters/tickets | `docs/cognee.md` MUST NOT table; `adapter-seam.md` |
| Write Letta memory | `docs/cognee.md`; Letta = memory/runtime stack |
| Replace Knowledge file canon | `docs/cognee.md` data classes |
| Auto-enable cloud | `docs/cognee.md` policy flags |
| Direct canon apply from graph | `adapter-seam.md` ratification path only |

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / proposed
- `[ ]` Not done

## Ship decision

**Ship as Proposed** — Contract, types, and adapter seam are merged (**040**). No runtime, no `pip install cognee` in Otto scripts until **041** proves local home. Honest empty: Cognee disabled by default.

## Follow-on tickets

- **041** — Local home (self-host + health)
- **042** — MCP recall bridge
- **043** — Capture Otto canon
- **044** — Knowledge graph surface
