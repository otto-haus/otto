# Cognee — Contract & Adapter Seam

**Status:** proposed (contract + local adapter seam; opt-in runtime)  
**Ticket:** **040**  
**Wave:** **041** local home · **042** MCP bridge · **043** capture · **044** graph surface  
**Authority:** derived recall sidecar under Knowledge — not memory, not canon

---

## One sentence

**Cognee** is an optional **derived relationship graph / recall adapter** that indexes Otto file artifacts with provenance and returns cited context packs — it may propose Curation updates but **never** mutates canon, Letta memory, or autonomy policy.

```txt
Letta     = memory/runtime
Otto      = behavior/curation
Files     = durable truth
Cognee    = derived relationship graph / recall sidecar (non-canonical)
```

---

## Authority stack (unchanged)

```txt
Canonical truth     → files under repo + Letta memory (governed separately)
Behavior change     → Curation proposals only
Derived recall      → Cognee (read-mostly sidecar)
```

Cognee sits **below** Otto curation authority and **beside** (not inside) Letta memory. See [`v1/contracts/adapter-seam.md`](v1/contracts/adapter-seam.md).

---

## What Cognee MAY do

| Action | Notes |
|--------|-------|
| Index Otto file artifacts | With provenance: `path`, `hash`, `captured_at`, `source_kind` |
| Answer recall queries | Entities, relationships, cited passages |
| Return context packs | To agents via MCP/SDK on the **read path** only |
| Propose Curation updates | Graph-derived insights → `proposals` adapter return type |
| Export graph snapshots | Non-authoritative artifacts for operator review |

**Allowed source kinds for capture (041+):** `receipt`, `charter`, `ticket`, `standard`, `precedent`, `manual` — never raw Letta memory blocks.

---

## What Cognee MUST NOT do

| Forbidden | Rule |
|-----------|------|
| Mutate Standards, Practices, Routines, charters, tickets | Files = truth; only Curation + ratification applies |
| Mutate autonomy policy | `autonomy/policy.yaml` is Otto-owned |
| Write Letta memory directly | Letta owns memory/runtime |
| Replace `KnowledgeStore` file canon | AI Frontier routing stays in `knowledge/ai-frontier/` |
| Become CRM, source of truth, or approval store | Derived graph only |
| Auto-enable Cognee Cloud | Requires explicit config + receipt (out of v1 scope) |
| Bypass adapter seam | All writes route through `proposals` → Curation |

**Hostile-read rule:** If a code path lets Cognee apply a proposal, patch a standard, or append a Letta block without a human Curation decision + receipt, that path is **invalid**.

---

## Adapter return types

Same seam as other external systems:

```txt
context        — recall results + citations + confidence
artifacts      — graph snapshots / export bundles (non-authoritative)
proposals      — candidate Curation proposals from graph-derived insights
```

Cognee does **not** return `work_state` as a primary contract (Paperclip owns work plane). It may attach work-state citations inside `context` when indexing ticket/receipt files.

---

## Recall vs Memory vs file canon

| Layer | Question it answers | Mutability |
|-------|---------------------|------------|
| **Files** | What did we ratify / record? | Human + Curation only |
| **Letta memory** | What did we learn in runs? | Letta + governed writebacks |
| **Knowledge (AI Frontier)** | What is true about the external world? | Routine + Curation for routing |
| **Cognee recall** | What entities/relationships connect across indexed artifacts? | Re-index only; never canon |

Recall results are **hints with citations**, not decisions. Low confidence → surface gaps; do not auto-act.

---

## Data classes

| Class | Examples | Cognee role |
|-------|----------|-------------|
| **Canon files** | `standards/`, `practices/`, `charters/`, tickets | Index read-only; cite path + hash |
| **Proof** | `receipts/`, run logs | Index for relationship edges |
| **Knowledge files** | `knowledge/ai-frontier/*` | Index; do not override registry authority |
| **Secrets** | API keys, tokens | **Never index** |
| **Letta blocks** | Agent memory | **Never index or write** |

---

## Connection & policy flags

| Flag | Default | v1 rule |
|------|---------|---------|
| Enabled | `false` | Opt-in via Settings or env |
| Base URL | `null` | Local loopback only: `127.0.0.1` / `localhost` |
| Cloud | off | Documented future path; not v1 proof |
| Capture cadence | manual | **043** defines jobs + receipts |

### Environment variables (041+)

```txt
OTTO_COGNEE_ENABLED=false          # master switch
OTTO_COGNEE_BASE_URL=http://127.0.0.1:8000
OTTO_COGNEE_CAPTURE_PATHS=         # comma-separated repo-relative roots (optional)
```

Boolean-only logging for connection state. Never log capture payloads containing secrets.

Settings → General → **Cognee** persists `enabled` and `baseUrl` to `~/.otto/config.json` and mirrors `OTTO_COGNEE_*` for the current Electron session.

---

## MCP setup (042)

Register Cognee MCP **only** when `OTTO_COGNEE_ENABLED=1` and `scripts/cognee-home.sh health` reports `ready`. Otherwise leave MCP unregistered (fail closed).

### Copy-paste — Cursor / Claude Code / Letta Code

Merge `config/cognee-mcp.template.json` into your MCP config (path varies by client):

```json
{
  "mcpServers": {
    "cognee-local-http": {
      "url": "http://127.0.0.1:8001/mcp",
      "env": {
        "OTTO_COGNEE_ENABLED": "1",
        "OTTO_COGNEE_BASE_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```

Full template with stdio fallback: `config/cognee-mcp.template.json`. Cognee 1.1.x prefers HTTP MCP on `:8001` when started via `cognee-cli -ui`; stdio `cognee-cli mcp` only when your install ships it.

**Read tools (green — `cognee.recall`):** search, recall, read_graph, context  
**Write tools (yellow — `cognee.capture`):** ingest, remember, add, cognify — use `scripts/cognee-capture.sh` batch path with receipt  
**Denied (red — `cognee.delete`):** delete, admin, purge — explicit approval only; not enabled in v1

Autonomy mapping lives in `autonomy/policy.yaml` under `actions.cognee.*`. Unit tests: `apps/desktop/electron/autonomy-store.test.ts`.

### Smoke (disposable conversation only)

```sh
export OTTO_COGNEE_ENABLED=1
./scripts/cognee-home.sh start
./scripts/cognee-home.sh health
task smoke:cognee-recall
# Optional Letta path (never conversation=default):
# OTTO_AGENT_ID=<agent-id> task smoke:cli — then one MCP recall question in a --new thread
```

Recall receipts: `receipts/cognee/recall/<id>.json` (`kind: cognee_recall`, query → path citations). Staging bundle: `docs/receipts/staging/cognee-recall-smoke-*.json`.

---

## Capture (043) — idempotent ingest

Canon capture is **manual** and **receipted**. Otto never treats Cognee as source of truth.

```sh
./scripts/cognee-capture.sh --kinds receipt,charter,ticket,precedent --dry-run
./scripts/cognee-capture.sh --kinds receipt,precedent --apply
```

**Idempotency rules:**

- Each `--apply` writes a new `receipts/cognee/capture/<capture-*.json>` with `capturedAt`, `paths`, `docCount`, and `provenance.git_commit`.
- Re-running `--apply` on unchanged files is safe: Cognee may re-index duplicates; Otto provenance is append-only (new receipt per run).
- Use `--since <git-ref>` (when implemented) or narrow `--kinds` to limit scope; dry-run always lists paths without ingest.
- Forbidden paths (`.env`, `secrets/`) are skipped at collection time — never partial-index secrets.
- Without `cognee` CLI installed, apply still writes a capture receipt (stub ingest) so the Knowledge pane can show last capture honestly.

**Allowed kinds:** `receipt`, `charter`, `ticket`, `standard`, `precedent`, `manual` — never Letta memory blocks.

---

## Failure modes

| Failure | Otto behavior |
|---------|---------------|
| Cognee stopped / unreachable | Graceful degrade; Knowledge + files still work |
| Stale index | Show `last_capture_at`; operator may re-run capture (**043**) |
| Low-confidence recall | Return citations + gap; no auto-proposal |
| Capture on forbidden path | Reject with receipt; do not partial-index secrets |
| Proposal emission | Queue as `proposed` only; `ProposalStore.decide()` required |

Missing Cognee is **not** an error state — same as any optional adapter.

---

## Core types (contract)

Defined in `@otto-haus/core` (`packages/core/src/types.ts`):

```ts
CogneeConnectionStatus  // disabled | stopped | starting | ready | error
CogneeHealth            // status, baseUrl, lastError, lastCheckedAt
CogneeCaptureReceipt    // id, capturedAt, sourceKind, paths, counts, provenance
```

No Cognee SDK in renderer. Desktop Settings may show `CogneeHealth` when **041** wires health checks.

---

## One-pager test mapping

| Test | How this contract satisfies |
|------|----------------------------|
| Knowledge ≠ Memory | Cognee is neither; explicit recall sidecar |
| Cognee under Knowledge, not parallel | Adapter under Knowledge wave **040–044** |
| Files remain truth | No canon write path |
| Curation owns behavior change | `proposals` only |

---

## Implementation tickets

| Ticket | Outcome |
|--------|---------|
| **040** | This contract + types + SHIP_CHECK stub |
| **041** | Local self-host + health probe |
| **042** | MCP recall bridge + autonomy gates |
| **043** | Provenance capture jobs + receipts |
| **044** | Thin Knowledge pane graph section |

Do not remove `cognee` from `model-registry.yaml` `deferred` until **041** proves local home.

---

## References

- [`knowledge.md`](knowledge.md) — Knowledge vs Memory
- [`v3/README.md`](v3/README.md) — graph layer parking → tracked
- [`v1/contracts/adapter-seam.md`](v1/contracts/adapter-seam.md) — adapter seam
- [`knowledge/README.md`](../knowledge/README.md)
- Cognee product (reference): https://www.cognee.ai
- HQ: `planning/hq-tickets/040-cognee-contract-adapter-seam.md`
