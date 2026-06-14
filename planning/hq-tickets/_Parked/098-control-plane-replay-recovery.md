# 098 — Control Plane: Replay & Recovery

Owner: Codex
Priority: P2
Depends on: 094, 095, 039
Release bucket: cathedral / always-on

**Unpark when:** **094**, **095** exist.

## Outcome

**Replay/recovery** policy: after crash, disconnect, or missed work — idempotent redelivery, lease expiry, honest queue state, no silent duplicate execution.

## Scope

- Idempotency keys on enqueue
- Lease TTL + orphan recovery
- Align **039** WS recovery with queue state
- Missed Letta cron: document only (Letta owns schedule engine)

## Done when

- [ ] Recovery doc + tests for queue redelivery
- [ ] Simulated runner disconnect → honest status + recover path
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
