# 094 — Control Plane: Command Queue Contract

Owner: Codex
Priority: P2
Depends on: 092, 084
Release bucket: cathedral / always-on

**Unpark when:** **092** reviewed; **084** D1 stub exists.

## Outcome

Durable **command queue** schema and enqueue/dequeue rules for operator intent (chat commands, ticket orchestrate, worker spawn, schedule-triggered work).

## Scope

- Schema: id, tenant, source, payload, priority, status, receipt_id, idempotency_key
- Local desktop queue (JSON/SQLite) + cloud queue (CF Queues + D1 index) per **090** layout
- Cancel, retry, dead-letter policy
- No execution without lease (**095**)

## Non-goals

- Paperclip queue mirror (021)

## Done when

- [ ] Contract in `docs/v1/contracts/command-queue.md`
- [ ] Stub enqueue in desktop or Worker with receipt
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
