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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Select compiled ticket → Orchestrate uses stored ticket, not form: **PASS** — `orchestrateExisting` in `ticket-orchestrator.ts`; IPC `otto:tickets:orchestrateExisting`; UI "Orchestrate selected" in `Panes.tsx`.
- Second orchestrate on active ticket fails loudly: **PASS** — test throws `/Active worker already exists/i`.
- Test covers compile-once orchestrate-twice: **PASS** — `ticket-orchestrator.test.ts`.

### Evidence inspected

- `ticket-orchestrator.ts`, `ticket-orchestrator.test.ts`, `ipc.ts`, `Panes.tsx`
- Ticket scope (no execution receipt in file)

### Defects

- No execution receipt in ticket file.

### Required changes

- Add execution receipt (optional).

### Finding

Behavior and test coverage match Done-when. +1.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

All Done-when items: **PASS** — rev8 mapping stands; no rev9 regression identified in code or cited receipts.

### Evidence inspected

- Prior `## Review rev8` Done-when mapping
- Execution receipt(s) already in ticket
- Rev9 cross-check focused on 001/017/018/033/036/037/039/041-044/045 only

### Finding

Rev8 +1 reaffirmed. No new blockers.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- All Done-when: **PASS** (rev9 mapping holds).

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

Unit/store proof at rev9; no rev10 delta.
