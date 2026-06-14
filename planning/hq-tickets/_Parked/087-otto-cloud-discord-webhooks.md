# 087 — Otto Cloud Phase 5: Discord Approval Webhooks

Owner: Cursor
Priority: P2
Depends on: 084, 056
Release bucket: otto cloud

**Extends unpark of 020** — host webhooks on Workers instead of desktop-only.

## Outcome

Discord (and future otto channels) approval prompts work when desktop is closed — Workers receive events, write approval records to D1, link Letta remote approve when needed.

## Scope

- `POST /api/webhooks/discord` on Workers
- Signature verification + autonomy gate
- Approval record in D1; receipt on action
- Coordinate `channels/channels.yaml` config for cloud URL

## Non-goals

- Letta channels product

## Done when

- [ ] Discord approval round-trip with desktop closed
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
