# 049 — Chat: Ticket Orchestration Commands

Owner: Cursor
Priority: P1
Depends on: 035, 048
Release bucket: v0.1 autonomy

## Outcome

Main Otto can compile and orchestrate tickets from **Chat** via explicit commands — not only the Tickets pane.

Examples: `compile ticket 034`, `orchestrate ticket 035`, `status workers`.

## Why this matters

Autonomy one-pager: "Main chat should orchestrate tickets." Today orchestrator exists but is pane-only.

## Scope

- Chat command parser or slash hooks for ticket compile/orchestrate/status
- Reuse `TicketOrchestrator` + existing IPC
- Responses include worker id, worktree path, run id, receipt link
- Autonomy gate on consequential actions
- Disposable smoke conversation only

## Out of scope

- Fully autonomous worker execution (060)
- Natural-language planner without explicit commands (future)

## Done when

- Staging Chat command compiles a ticket packet without re-compile bug (035 fixed)
- Orchestrate spawns worker record + receipt
- Worker status returned in Chat transcript
- Receipt proves command path

## Verification

```sh
bun test ./apps/desktop/electron/ticket-orchestrator.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
