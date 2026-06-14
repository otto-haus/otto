# 045 — Chat: Permission Modal + Abort Terminal Fix

Owner: Cursor
Priority: P0
Depends on: 002, 003
Release bucket: v0.1 behavior loop

## Outcome

Letta tool approvals never deadlock Chat. Abort always clears `busy` and re-enables the composer.

When done, a consequential tool request shows an in-Chat approval card; approve/deny returns to runtime; timeout/abort rejects parked resolvers; stream end and abort emit terminal events.

## Why this matters

Craft audit P0: `canUseTool()` parks a promise until `resolvePermission`, but no renderer UI is wired — turns hang. Abort breaks the stream without clearing `busy`. This blocks the Approvals one-pager test and makes live Chat untrustworthy.

Source: `docs/otto-craft-punchlist.md` items 1–2; `apps/desktop/electron/letta-runner.ts`.

## Scope

- Wire `runtime.onPermission` → Chat modal/card (scope, tool, allow once / deny / allow session)
- Call `runtime.permission.respond(requestId, decision)`
- Timeout + window-close cleanup for pending permission resolvers
- Emit terminal `result` or `error` on abort and normal stream end
- Receipt/trace for approval decisions (reuse receipt writer)
- Staging smoke with disposable conversation

## Out of scope

- Discord approval delivery (020)
- Autonomy policy editor changes
- WS transport (039) — but interface must stay compatible

## Done when

- Simulated or real tool gate shows modal in staging Chat
- Deny path completes turn without hang
- Approve path resumes tool execution
- Abort mid-turn clears busy within one frame cycle
- No smoke uses `conversation=default`
- Unit tests for permission timeout + abort terminal events
- Execution receipt maps each Done-when item

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
bun test ./apps/desktop/electron/*.test.ts
apps/desktop/scripts/deploy-staging.sh
```

## Blocker log

Leave blank unless blocked.
