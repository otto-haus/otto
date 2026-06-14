# 022 — Paperclip: Task Creation (Approval Door)

Owner: Cursor
Priority: P2
Depends on: 021, 049, 051
Release bucket: vNext adapters

**Unpark when:** Read-only import (021), Chat ticket commands (049), and review gate (051) exist.

## Boundary

External side effect. **Every** Paperclip task create/update requires an explicit approval door + receipt. Paperclip never becomes source of truth for otto ticket Done.

## Outcome

Otto can create Paperclip tasks **only** from ratified otto tickets or active Charters — with approval record and auditable mapping.

## Scope

### Preconditions (all required)

- Source: ratified otto **Ticket** or **Charter** (folder/ticket state is truth).
- Autonomy classifies action as **external write / one-way door**.
- **Approval record** exists and matches scope (ticket id, charter id, intended Paperclip action).
- Connector enabled per 021 (already door-gated).

### API wrapper

- Create (and optional update metadata) via Paperclip API.
- Idempotency: store `ottoTicketId → paperclipTaskId` mapping locally; no duplicate creates on retry without explicit re-approve.

### Receipt (required fields)

```txt
otto_ticket_id
otto_charter_id (if any)
approval_id
paperclip_task_id
paperclip_url
actor
timestamp
```

### Non-goals

- Bulk sync of all HQ tickets
- Paperclip-driven status → otto Done (see 075)
- Writes without approval

## Done when

- [ ] Staging: approved ticket → one Paperclip task with full receipt chain
- [ ] Blocked without approval (UI + store)
- [ ] Blocked from draft/unratified tickets
- [ ] Duplicate retry does not spawn ghost tasks
- [ ] Reviewer +1

## Verification

```sh
# manual: ratified ticket → request create → approval → task + receipt
# manual: skip approval → blocked + receipt:blocked
```

## Related

- **021** — read-only import + connector enable door
- **075** — completion → “review requested” not Done

## Blocker log

Leave blank unless blocked.
