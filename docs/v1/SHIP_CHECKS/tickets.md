# Ship Check — Tickets

## Spec promise

Tickets are bounded worker slices. Charters define the bet; Tickets define the slice; Workers execute the slice; Receipts prove the slice.

## Required file contract

- [ ] `templates/ticket.yaml` exists.
- [ ] `templates/worker-packet.md` exists.
- [ ] `docs/ticketcraft.md` exists.
- [ ] Ticket state/lifecycle is documented.
- [ ] Receipt requirement is explicit.

## Required runtime behavior

- [ ] Can compile a bounded ticket packet, or manual process is documented.
- [ ] Worker-owned paths and stop conditions are specified.
- [ ] Completion requires receipt.

## Required tests/demo

- [ ] If no `/ticket` command exists, mark template/spec only.
- [ ] If demo included, label as Ticketcraft under Autonomy and state runtime limitations.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
