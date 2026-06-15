# Issue #280 — live agent activity receipt

## Before

During an agent turn, Chat showed only a generic `thinking…` pulse while tools and reasoning ran. No signal for which step was active.

## After

- Runtime maps Letta SDK events (`tool_call`, `tool_result`, `reasoning`, `stream_event`) and WS `stream_delta` tool/reasoning message types into `turnActivity`.
- Chat replaces the generic pulse with the live label (e.g. `Reading file…`, `Reasoning…`, `Running command…`).
- The pulse hides once assistant text starts streaming so the status line does not stack under the reply.

## Verify

```sh
bun test apps/desktop/src/chat/turn-activity.test.ts
bun test apps/desktop/electron/runtime-transport/ws-protocol.test.ts
bun run --cwd apps/desktop typecheck
```

Manual: send a message that triggers tool use; confirm the activity label updates before the assistant reply appears.
