# AI Frontier Review Routine

Keeps **Knowledge** current so Otto's assumptions track the real AI frontier.

> Knowledge keeps Otto's assumptions current.
> Autonomy should track actual AI capability, not inherited human-era assumptions.

## What it does

1. Check **Artificial Analysis**.
2. Check **METR / frontier capability notes**.
3. Update the **model registry**.
4. Compare external claims to Otto **observed performance**.
5. Propose **Autonomy / model-routing updates through Curation**.
6. Write a **receipt**.

## The autonomy line

```txt
FACTS   (ratings, notes, costs, source links, last_verified)
        → updated autonomously, each with a receipt.

POLICY  (model routing, autonomy expansion, ticket sizing, provider allowlist)
        → proposed only; Curation classifies; Sebastian ratifies.
```

External claims are checked against our own
[`observed-performance/`](../../knowledge/ai-frontier/observed-performance/) — **our
evidence wins ties.**

## Status & activation

- `status: proposed`. Otto may run a **one-off trial** autonomously (low-risk,
  internal, no new permissions).
- **Recurring activation requires Sebastian's nod** — a standing Routine is a standing
  claim on attention (`requires_approval_to_activate: true`).
- Proposed cadence: weekly (Mon 09:00 America/Los_Angeles), `attention_cost: low`. If
  Sebastian would not miss it, prune or slow it.

## Wiring

- Reads/writes: [`knowledge/ai-frontier/`](../../knowledge/) (see `routine.yaml` `reads`
  / `writes_autonomously` / `proposes_via_curation`).
- Proposals use [`knowledge/_templates/knowledge-curation-proposal.yaml`](../../knowledge/_templates/knowledge-curation-proposal.yaml).
- Receipts use [`knowledge/_templates/knowledge-update-receipt.md`](../../knowledge/_templates/knowledge-update-receipt.md).
- Doctrine: [`../../docs/knowledge.md`](../../docs/knowledge.md).
