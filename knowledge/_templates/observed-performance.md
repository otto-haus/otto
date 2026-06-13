# Observed performance: <short title>

> Copy to `knowledge/ai-frontier/observed-performance/YYYY-MM-DD-<slug>.md`.
> One observation per file. This is internal evidence about real model behavior.

- date: <YYYY-MM-DD>
- kind: <ticket_outcome | worker_quality | routing_win | routing_loss | cost_surprise | latency_issue | failure_pattern | decision_grade>
- model/route: <provider/model and the role it was filling, e.g. anthropic/claude-opus-class as ticket_worker>
- source: <ticket id / run id / receipt path / conversation id>

## What happened
<concise: what the model was asked to do and what actually happened>

## Expected vs actual
<what we expected from current capability assumptions vs what we observed>

## Cost / latency (if relevant)
<expected vs actual>

## Implication
<does this confirm or contradict model-registry.yaml? does it argue for a routing,
autonomy, or ticket-sizing change?>

## Proposed follow-up
<none | update facts (notes/costs) + receipt | Curation proposal (routing/autonomy/policy change)>
