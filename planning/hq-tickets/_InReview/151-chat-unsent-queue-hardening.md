# 151 — Chat Unsent Queue Hardening

Owner: Codex
Priority: P1
Depends on: 003, 045, 046
Release bucket: v0.1 functional ship — Chat reliability

## Outcome

Queued Chat messages are durable and operator-facing without leaking staging smoke IDs or losing same-millisecond user sends.

## Why this matters

The Chat queue is a reliability feature. If it dedupes user messages because two queued rows share an ID, or if staging smoke messages reappear as operator content, otto breaks the receipt-first trust boundary before the runtime even acts.

## Scope

- Review the new `apps/desktop/src/chat/queue-storage.ts` module and Chat queue call sites.
- Preserve the queue's local-first Web Storage design.
- Use stable queue-item construction instead of ad hoc timestamp IDs in multiple UI paths.
- Test migration/sanitization of legacy queue storage.

## Out of scope

- Cloud command queue (`094+`).
- Changing the visible Chat redesign, model picker behavior, or thread list.
- Opening a remote PR without Sebastian approval.

## Critique pass — 2026-06-14 Codex

Feature reviewed: durable Chat unsent-message queue.

Design decisions:

- Right: keeping this queue in renderer localStorage is acceptable for unsent Chat drafts because the data is per-origin, local, and bounded; it is not an authority ledger.
- Right: separating `INFLIGHT_KEY` from visible queued rows avoids showing a message as waiting after it has already been handed to the runtime.
- Right: filtering staging smoke thread markers prevents disposable smoke messages from becoming operator-facing queue content.
- Wrong: the initial implementation had multiple ad hoc queue item constructors (`starter-${Date.now()}` and `${Date.now()}-${items.length}`). Same-millisecond sends could collide, and future call sites could drift from the queue-storage invariants.

Docs/best-practice context:

- React docs: user-triggered state updates belong in event handlers; derived UI values should be calculated during render; Effects should synchronize with external systems.
- MDN: `crypto.randomUUID()` generates v4 UUIDs using a cryptographically secure random number generator; Web Storage is a browser mechanism for origin-scoped key/value persistence.

## Rebuild

- Added `createQueueItem()` in `apps/desktop/src/chat/queue-storage.ts`.
- Switched Chat manual sends and onboarding starter sends to the shared factory.
- Added queue tests for unique IDs and legacy storage sanitization/migration.

Implemented in commit: `bedbd42 fix(desktop): runtime status mapping and queue smoke test coverage`

## Done when

- [x] Queue item IDs are generated through one shared helper.
- [x] Manual Chat send and onboarding starter send use the same helper.
- [x] Legacy queue migration drops smoke-thread markers and persists sanitized v2 storage.
- [x] Focused queue tests pass.
- [ ] Independent reviewer +1.
- [ ] PR opened after approval and clean branch review.

## Verification

```sh
bun test ./apps/desktop/src/chat/queue-storage.test.ts
bun run --cwd apps/desktop typecheck
```

Result: both passed in this pass.

## Blocker log

- Browser proof blocked: the in-app Browser runtime exists but `iab` target is unavailable in this session.
- PR not opened: remote publication is approval-gated, and the worktree currently contains unrelated dirty files outside this ticket.
