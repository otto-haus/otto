# 096 — Control Plane: Audit Export Bundle

Owner: Cursor
Priority: P2
Depends on: 092, 084
Release bucket: cathedral / always-on

**Unpark when:** **092** reviewed; receipt ledger (**084**) stub.

## Outcome

Operator can **export an audit bundle**: receipts, approval records, ticket transitions, adapter events — no secrets, no Letta memory blocks.

## Scope

- Export format (JSON + manifest + R2 artifact refs)
- Desktop export first; cloud export via Workers
- Retention policy note (operator responsibility v1)

## Done when

- [ ] Export command produces verifiable bundle
- [ ] Bundle excludes provider keys and memory blocks
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
