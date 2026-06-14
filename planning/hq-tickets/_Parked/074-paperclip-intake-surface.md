# 074 — Paperclip: Intake Surface (Thin)

Owner: Claude
Priority: P2
Depends on: 021, 056
Release bucket: vNext adapters

**Unpark when:** Read-only import (021) works; System Tickets surface shipped (056).

## Boundary

Tripwire slice, not a dashboard. Shows imported **work_state**; does not let Paperclip status override otto truth.

## Outcome

Operators see Paperclip context inside otto without leaving the workspace — under **Tickets / Intake**, not a new top-level product.

## Scope

Thin panel (or Tickets sub-section):

- Active tasks (from last sync)
- Blocked tasks
- Recent artifacts (links only)
- Last sync time + error if any
- Source links → Paperclip (open external)
- **Connect / Sync** → routes through 021 approval-gated connector

### Honest states

- Not connected: empty state + “Connect Paperclip” (approval door via 021)
- Connected, no data: empty sync state
- Sync error: show reason; no mock rows

### Non-goals

- Full Paperclip UI embed
- Editing tasks in otto (022 only, door-gated)
- Budget/heartbeat management UI
- Paperclip status → otto Done

## Done when

- [ ] Surface visible from Tickets/Intake nav
- [ ] Shows real imported rows after 021 sync
- [ ] No mock operational data
- [ ] Staging screenshots + reviewer +1

## Related

- **021** — data source
- **022** — optional “Create in Paperclip” CTA from ratified ticket (door-gated)

## Blocker log

Leave blank unless blocked.
