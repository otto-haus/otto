# 040 — Cognee Contract & Adapter Seam

Owner: Codex
Priority: P1
Depends on: 018, 033–038
Release bucket: vNext knowledge

## Outcome

Cognee is **unparked** as an optional **implementation under Knowledge**, not a parallel memory system. Otto has a written contract, adapter types, and seam rules so Cognee can be installed locally without violating:

```txt
Letta     = memory/runtime
Otto      = behavior/curation
Files     = durable truth
Cognee    = derived relationship graph / recall sidecar (non-canonical)
```

When done, docs and types answer: what Cognee may index, what it may return, what it may never mutate, and how recall differs from Memory and from file canon.

## Why this matters

The Knowledge one-pager deferred Cognee until a real query forced it. The product now has a forcing function: relationship recall across Otto canon (charters, tickets, receipts, precedents, HQ context) without building a bespoke graph in-repo.

Cognee's pitch (capture → model → recall, MCP/SDK, local self-host) fits Otto's **adapter seam** if — and only if — Cognee stays below Curation authority.

This ticket is the gate before any `pip install cognee` lands in Otto scripts.

## Source anchors

- Knowledge doctrine: `docs/knowledge.md`, `knowledge/README.md`
- v3 parking lot: `docs/v3/README.md` (Cognee boundary)
- Adapter seam: `docs/v1/contracts/adapter-seam.md`
- Deferred flag: `knowledge/ai-frontier/model-registry.yaml` → `deferred: cognee`
- Scope guard (was blocked pre-018): `planning/hq-tickets/000-workflow.md`
- Cognee product (reference only): https://www.cognee.ai — local OSS + MCP; cloud optional

## Architecture target

### 1. Authority stack (unchanged)

```txt
Canonical truth     → files under repo + Letta memory (governed separately)
Behavior change     → Curation proposals only
Derived recall      → Cognee (read-mostly sidecar)
```

### 2. Cognee adapter contract

Add `docs/cognee.md` (or equivalent section in `docs/knowledge.md` if team prefers one doc) defining:

**Cognee MAY**

- index Otto file artifacts with provenance (path, hash, captured_at, source_kind)
- answer recall queries (entities, relationships, cited passages)
- return **context packs** to agents via MCP/SDK (read path)
- propose Curation updates (never apply)

**Cognee MUST NOT**

- mutate Standards, Practices, Routines, charters, tickets, or autonomy policy directly
- write Letta memory directly
- replace `KnowledgeStore` file canon for AI Frontier routing
- become CRM, source of truth, or approval store
- auto-enable cloud without explicit config + receipt

**Adapter return types** (extend adapter seam mentally; no bypass):

```txt
context        — recall results + citations + confidence
artifacts      — graph snapshots / export bundles (non-authoritative)
proposals      — candidate Curation proposals from graph-derived insights
```

### 3. Core types (minimal)

In `packages/core` or desktop shared types, add something like:

```ts
type CogneeConnectionStatus = 'disabled' | 'stopped' | 'starting' | 'ready' | 'error';

interface CogneeHealth {
  status: CogneeConnectionStatus;
  baseUrl: string | null;
  lastError: string | null;
  lastCheckedAt: string | null;
}

interface CogneeCaptureReceipt {
  id: string;
  capturedAt: string;
  sourceKind: 'receipt' | 'charter' | 'ticket' | 'standard' | 'precedent' | 'manual';
  paths: string[];
  docCount: number;
  entityCount: number | null;
  provenance: Record<string, string>;
}
```

Keep types thin; no Cognee SDK in renderer.

### 4. Policy flags

- Default: **Cognee disabled** until Settings or env opts in.
- Local loopback only in v1: `127.0.0.1` / `localhost`.
- Cloud signup is **out of scope** for Otto v1 proof; document as future optional path.
- Remove or downgrade `cognee` from `model-registry.yaml` `deferred` list only after 041 proves local home — not in this ticket.

### 5. One-pager test mapping

| One-pager test | This ticket enables |
|---|---|
| Knowledge ≠ Memory | explicit in contract |
| Cognee under Knowledge, not parallel | adapter placement |
| Files remain truth | no canon write path |
| Curation owns behavior change | proposals only |

## Scope

- Author `docs/cognee.md` with boundary, data classes, env vars, failure modes.
- Update `docs/knowledge.md` deferred section to point at Cognee wave (041–044), not "never."
- Update `docs/v3/README.md` status from pure parking lot to "implementation tracked by HQ 040–044."
- Extend adapter seam doc with Cognee as exemplar recall adapter.
- Add core types + `CogneeHealth` placeholder in desktop shared types if needed for Settings (no runtime yet).
- Add `SHIP_CHECKS/cognee.md` stub with ship decision **Ship as Proposed**.

## Out of scope

- Installing or running Cognee (041).
- MCP wiring (042).
- Capture jobs (043).
- Desktop graph UI (044).
- Cognee Cloud billing / team tenancy.
- People Context Packs production feature (024 remains parked until 044 proves recall).
- Stacks integration (023).

## Done when

- `docs/cognee.md` exists and passes a hostile read: no path lets Cognee mutate canon or Letta memory.
- `docs/knowledge.md` and `docs/v3/README.md` updated; no contradiction with Letta/Otto split.
- Adapter seam doc mentions Cognee with the same proposal-only write path as other adapters.
- Core types for health/capture receipt exist (or documented JSON schema if types deferred with justification).
- `SHIP_CHECKS/cognee.md` exists with honest **Ship as Proposed** and links to 041–044.
- Execution receipt lists doc paths and reviewer can trace every forbidden mutation to an explicit rule.

## Verification

```sh
cd /Users/seb/Code/otto
git status --short --branch
bun run typecheck
# Doc link sanity
rg -n "Cognee|cognee" docs/knowledge.md docs/cognee.md docs/v3/README.md docs/v1/contracts/adapter-seam.md
```

## Blocker log

Leave blank unless blocked.
