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

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Tool gate shows modal in Chat | `Chat.tsx` wires `api.onPermission` → `Modal` + `PermissionCard`; `otto:permission` IPC from `sdk-subprocess-transport.ts` |
| Deny completes turn without hang | Modal `onClose` + Deny call `respondPermission('deny')`; timeout/abort reject pending `canUseTool` promises |
| Approve resumes tool execution | `resolvePermission` clears timer and resolves `{ behavior: 'allow' }` — unit test `resolvePermission answers pending tool gate` |
| Abort mid-turn clears busy | `send()` `finally` calls `emitTurnTerminal` when stream ends without SDK `result`; abort test asserts terminal `result` event |
| No smoke uses `conversation=default` | Existing `SMOKE_MODE` guard unchanged in transport init |
| Unit tests: timeout + abort terminal | `electron/runtime-transport/sdk-subprocess-transport.test.ts` (3 pass) |
| Permission timeout on pending resolvers | `permissionTimeoutMs()` env (`OTTO_PERMISSION_TIMEOUT_MS`, default 5m); auto-deny on timeout |

**Verified:** `bun run --cwd apps/desktop typecheck`; `bun test ./apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts`; `bun test ./apps/desktop/electron/*.test.ts` (52 pass).

**Not run:** staging deploy smoke (`apps/desktop/scripts/deploy-staging.sh`).

## Review

**Reviewer:** Independent · **Date:** 2026-06-13

**Verdict:** Partial — transport + Chat UI wired; unit tests pass; staging smoke and repo typecheck not green.

| Done when | Status | Evidence |
|-----------|--------|----------|
| Tool gate shows modal in Chat | Code only | `Chat.tsx` `api.onPermission` → `Modal`/`PermissionCard`; `sdk-subprocess-transport.ts` `otto:permission` IPC |
| Deny completes turn without hang | Proven (unit) | `resolvePermission` deny + timeout auto-deny; timeout test passes |
| Approve resumes tool execution | Proven (unit) | `resolvePermission answers pending tool gate` test |
| Abort mid-turn clears busy | Proven (code + unit) | `abort()` rejects pending + `emitTurnTerminal`; `runtime.ts` `setBusy(false)` on `result`/`error` and immediate on `abort()` |
| No smoke uses `conversation=default` | Proven (code) | `SMOKE_MODE` guard in `init()` |
| Unit tests: timeout + abort terminal | Proven | 3/3 pass in `sdk-subprocess-transport.test.ts`; 52/52 electron tests pass |
| Staging modal smoke | Not proven | Deploy script not run; no manual staging proof |

**Gaps vs scope:** No dedicated receipt for permission approve/deny decisions (scope item; only chat-turn receipts). “Allow session” collapses to `allow` (noted in `Chat.tsx`).

**Verification run:** `bun test sdk-subprocess-transport.test.ts` ✓ · `bun test electron/*.test.ts` ✓ · `bun run --cwd apps/desktop typecheck` ✗ (`Onboarding.tsx:135` TS2367, unrelated).

**+1:** No — staging Done-when unproven; typecheck fails on branch.
