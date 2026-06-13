# Observed performance

Otto's **own evidence** about how models actually performed for us — the internal
counterweight to external benchmarks.

> Our own evidence wins ties against external claims.

## What lands here

```txt
ticket outcomes      did the assigned model finish the ticket cleanly?
worker quality       quality of a worker's output vs expectation
routing wins/losses  did the routing choice help or hurt?
cost surprises       actual cost vs expected
latency issues       where latency hurt
failure patterns     recurring ways a model/route failed
decision grades      graded decisions that depended on a capability assumption
```

## How to add one

Copy [`../../_templates/observed-performance.md`](../../_templates/observed-performance.md)
to `observed-performance/YYYY-MM-DD-<slug>.md` and fill it in. One observation per file.

These are **facts** — capturing one is autonomous. But when observations form a pattern
that argues for a routing / autonomy / ticket-sizing change, raise a **Curation
proposal** (`type: knowledge_update`); do not silently re-route.

## Why a folder, not a log

Each observation is evidence the AI Frontier Review Routine can cite when it proposes a
registry update. Many small dated files > one giant log: they're linkable from receipts
and Curation proposals.
