# 035 — Tickets: orchestrate selected ticket without re-compile

Owner: Cursor
Priority: P1
Depends on: none
Release bucket: v0.1

## Outcome

User can orchestrate an already-compiled ticket from the list without overwriting `ticket.yaml` from the form.

## Why this matters

Current orchestrate always calls `compile()` with form input — duplicates workers, overwrites tickets, blocks list-driven workflow.

## Scope

- `ticket-orchestrator.ts`: `orchestrateExisting(ticketId)` path
- IPC + preload + Tickets pane: Orchestrate on selected row
- Guard: reject duplicate active worker for same ticket slug

## Out of scope

- Full automated worker execution (scaffold-only per ship check)

## Done when

- Select compiled ticket → Orchestrate uses stored ticket, not form slug/objective
- Second orchestrate on active ticket fails loudly or shows existing worker
- Test covers compile-once orchestrate-twice behavior

## Verification

```sh
cd /Users/seb/Code/otto
bun --cwd apps/desktop test ./electron/ticket-store.test.ts
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.
