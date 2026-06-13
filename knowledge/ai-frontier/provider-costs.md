# Provider costs — AI Frontier

Cost posture per provider/model. Pairs with [`model-registry.yaml`](model-registry.yaml)
(`cost_tier`) and [`capability-notes.md`](capability-notes.md).

> Last reviewed: 2026-06-13 · Next review due: 2026-06-20 (AI Frontier Review Routine)

Costs are **facts** — Knowledge updates them autonomously from provider pricing pages
and writes a receipt. A cost finding that *changes routing* (e.g. "switch docs_worker to
a cheaper model") is a Curation proposal, not a silent edit.

## Cost posture (Sebastian's standing preference)

- Default to **batch / slow / cheapest** request paths when latency does not matter.
- Prefer lower-cost asynchronous processing for non-urgent jobs.
- Latency-sensitive or high-judgment work may use the expensive tier deliberately.

## Per-provider (fill from pricing pages each review)

> Numbers intentionally left as TODO rather than guessed (No Fake Done). The Routine
> populates these from the providers' pricing pages and records the source + date.

| Provider | Model | Input $/Mtok | Output $/Mtok | Batch discount | Verified | Source |
|---|---|---|---|---|---|---|
| openai | codex-5.5-extra-high | TODO | TODO | TODO | false | pricing page |
| openai | chatgpt-extended-pro | TODO | TODO | TODO | false | pricing page |
| anthropic | claude-opus-class | TODO | TODO | TODO | false | pricing page |

## Cost surprises log

Record real cost surprises here (also captured as observed-performance). A pattern of
surprises is evidence for a routing/ticket-sizing Curation proposal.

- _(none yet)_
