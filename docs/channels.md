# Channels

Channels are how Otto reaches you off-desktop. They are **not** source of truth.

```txt
Files     = truth
Channels  = reachability
Curation  = ratification for consequential outbound actions
```

## v1 backend

Discord is the v0/v1 backend: status, field notes, approval prompts, and receipt links.

Configuration lives in `channels/channels.yaml`. Outbound sends require approval unless explicitly scoped and ratified.

## Approval gate

Any outbound channel action that posts, publishes, or sends externally is a one-way door. Autonomy classifies it as red-zone; Curation emits the approval record when ratified.

## Receipts

Channel sends and approval replies write receipts under `~/.otto/receipts/` with subject type appropriate to the action.

## Deferred

iMessage, Slack, and email adapters are documented stubs only until a concrete workflow needs them.
