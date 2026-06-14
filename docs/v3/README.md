# Otto v3 — Relationship and Source Graph Layer

**Status:** parking lot for product surfaces; **Cognee implementation tracked by HQ 040–044**.

v3 is where Otto gains optional graph/context sidecars after v1 and v2 are real. The
Cognee contract (**040**) is merged; local home, MCP, capture, and UI follow **041–044**.

```txt
Letta     = memory/runtime
Otto      = behavior/curation
Paperclip = work plane
Cognee    = relationship graph/context recall
Stacks    = source-truth corpus
Files     = durable truth
```

## Candidate v3 surfaces

- **People / Relationships** — source-backed relationship context packs.
- **Sources / Stacks** — citation-first corpus search, gaps, source packets.
- **Graph context** — who/what is connected to whom, with evidence and confidence.

## Cognee boundary

Canonical contract: [`docs/cognee.md`](../cognee.md) (**040**).

Cognee is a derived relationship graph, not truth.

```txt
Raw facts can be indexed.
Interpretations must be proposed.
Commitments must be ratified.
```

Cognee may help answer:

- Who is this?
- How do we know them?
- What happened before?
- What do they care about?
- What promises are open?
- What should we not say?
- What is the next best ask?
- What source backs this?

## Stacks boundary

Stacks is the source-truth/citation substrate, not memory or decision-maker.

It should return cited context packs with:

- passages
- source IDs
- confidence
- gaps
- suggested next fetches
- retrieval receipts

## What v3 must not do

- Do not make Cognee the CRM.
- Do not make Cognee canonical memory.
- Do not let Cognee mutate Standards, Practices, Routines, approvals, or Letta memory directly.
- Do not let Stacks make legal/product decisions.
- Do not add v3 sidecars before v1/v2 loops work.

## First useful v3 feature

**People Context Pack** inside Otto:

```txt
person -> org -> last interactions -> open loops -> objections -> artifacts shown -> next ask -> source-backed timeline -> suggested Curation updates
```

Build only after one real Veto/sales relationship needs it.
