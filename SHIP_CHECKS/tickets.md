# Ship Check — Tickets

> **Canonical:** `docs/v1/SHIP_CHECKS/tickets.md` — this file is a synced mirror.

## Spec promise

Tickets are bounded worker slices. Charters define the bet; Tickets define the slice; Workers execute the slice; Receipts prove the slice.

## Required file contract

- [x] `templates/ticket.yaml` exists.
  - Evidence: `templates/ticket.yaml`

- [x] `templates/worker-packet.md` exists.
  - Evidence: `templates/worker-packet.md`

- [x] `docs/ticketcraft.md` exists.
  - Evidence: `docs/ticketcraft.md`

- [x] Ticket state/lifecycle is documented.
  - Evidence: `templates/ticket.yaml` status enum; `TicketStore` uses same lifecycle

- [x] Receipt requirement is explicit.
  - Evidence: `TicketStore.compile` writes receipt via `ReceiptWriter`; worker packet template requires receipt

## Required runtime behavior

- [x] Can compile a bounded ticket packet.
  - Evidence: `TicketStore.compile` → `ticket.yaml` + receipt; desktop Tickets pane compile form; IPC `otto:tickets:compile`

- [x] Worker-owned paths and stop conditions are specified.
  - Evidence: compiled `ticket.yaml` includes `owned_paths`, `stop_conditions` from compile input defaults

- [x] Completion requires receipt.
  - Evidence: compile/orchestrate paths write `otto.receipt.v1` records; orchestrator test verifies reuse without re-compile

- [x] Orchestrate without recompile (035).
  - Evidence: `TicketOrchestrator.orchestrateExisting`; `ticket-orchestrator.test.ts`

## Required tests/demo

- [x] Desktop store tests green.
  - Evidence: `ticket-store.test.ts`, `ticket-orchestrator.test.ts`

- [~] Letta `/ticket` extension command.
  - Gap: desktop IPC path ships; Letta Code extension CLI parity deferred (130)

## Staging smoke (desktop pane)

- Load: Tickets pane lists `~/.otto/tickets/` entries
- Empty: no tickets → compile form only
- Compile: writes ticket + shows receipt id in message bar
- Orchestrate: spawns worker + run; re-orchestrate existing ticket without re-compile
- Skipped: `skipped` count from loader when ticket dirs lack valid `ticket.yaml` (037)

## Automated verification

```sh
bun test ./apps/desktop/electron/ticket-store.test.ts \
  ./apps/desktop/electron/ticket-orchestrator.test.ts
```

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Ship in v0.1** — desktop compile + orchestrate + worktree workers; extension `/ticket` CLI parity deferred.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
