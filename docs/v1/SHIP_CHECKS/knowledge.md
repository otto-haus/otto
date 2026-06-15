# Ship Check — Knowledge

## Spec promise

Knowledge is maintained external-world understanding. v1 focuses on AI Frontier / Model Intelligence so Autonomy tracks actual capability.

## Required file contract

- [x] `docs/knowledge.md` exists.
  - Evidence: `docs/knowledge.md`

- [x] Model registry exists.
  - Evidence: `knowledge/ai-frontier/model-registry.yaml` — `status: proposed`

- [x] Capability notes exist.
  - Evidence: `knowledge/ai-frontier/capability-notes.md`

- [x] Provider costs exist.
  - Evidence: `knowledge/ai-frontier/provider-costs.md` — pricing placeholders per No Fake Done

- [x] Observed performance template exists.
  - Evidence: `knowledge/_templates/observed-performance.md`

- [x] Knowledge update receipt template exists.
  - Evidence: `knowledge/_templates/knowledge-update-receipt.md`

- [x] Curation proposal template exists.
  - Evidence: `knowledge/_templates/knowledge-curation-proposal.yaml`

## Required runtime behavior

- [~] Knowledge updates write receipts.
  - Partial: AI Frontier Review Routine is YAML-only; no automated executor (062). Receipt template ready.

- [~] Knowledge can propose Curation changes.
  - Partial: Template + doctrine exist; Curation ratification path is desktop proposal flow, not full queue.

- [x] Model-routing policy is not silently changed by Knowledge alone.
  - Evidence: `KnowledgeStore` reads `routing.status` as `proposed|active`; desktop Knowledge pane shows proposed warning; `AutonomyStore` and `TicketOrchestrator` read routing via `resolveModelForRole` — no silent mutation path.

## Required status

- [x] Registry status is `proposed` unless ratified.
  - Evidence: `model-registry.yaml` → `status: proposed`; routing block `status: proposed`

- [x] Public claims say Proposed, not Shipped.
  - Evidence: `receipts/otto-v01/knowledge.md` header — PROPOSED

## Required demo

- [~] `demo/out/otto-v01-knowledge.mp4` clearly says Proposed if unratified.
  - Evidence: file exists; Remotion re-enactment per v0.1 demo policy

## Automated verification

- [x] `KnowledgeStore` tests green.
  - Evidence: `apps/desktop/electron/knowledge-store.test.ts` — registry load, `resolveModelForRole('ticket_worker')`, malformed registry fallback
  - Command: `bun test ./apps/desktop/electron/knowledge-store.test.ts` (3 pass)

## Staging smoke (desktop pane)

- [x] CDP staging proof captured.
  - Evidence: `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` — `tickets.055.ok: true`, `api.registryStatus: proposed`
  - Summary: `docs/receipts/staging/hygiene-staging-proof-20260614143512.md`

- Load: Knowledge pane reads `knowledge/ai-frontier/model-registry.yaml` via IPC `otto:knowledge:list`
- Empty: missing registry shows "Registry not found" with path
- Proposed: status pill + notice when `registry.status === 'proposed'`
- Routing: assignments table visible; Autonomy evaluation cross-link shows `knowledge_routing` when classified

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Ship in v0.1** — file-backed registry + desktop surface + Autonomy/ticket routing read path. Registry and routing remain **proposed** until Curation ratification; claims must say Proposed.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
