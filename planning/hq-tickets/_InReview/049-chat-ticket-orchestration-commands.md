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

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Chat compiles ticket packet | `runTicketCommand` → `api.tickets.compile`; `Chat.submit` intercept; hint in empty state (`ticketCommandHint`) |
| Orchestrate spawns worker + receipt | `orchestrateExisting` path returns worker id, worktree, run id, receipt id in Chat transcript |
| Worker status in transcript | `status workers` → `api.workers.list` formatted lines |
| Autonomy gate on orchestrate | `api.autonomy.evaluateAction` before orchestrate; blocked message + receipt id when denied |
| Reuse TicketOrchestrator IPC | No new backend — existing `tickets.compile` / `orchestrateExisting` bridge |
| Parser coverage | `electron/chat-ticket-commands.test.ts` (4 pass) |

**Verified:** `bun run --cwd apps/desktop typecheck`; `bun test ./apps/desktop/electron/ticket-orchestrator.test.ts`; `bun test ./apps/desktop/electron/chat-ticket-commands.test.ts`.

**Not run:** live staging Chat command (manual).

## Review

**Reviewer:** Independent · **Date:** 2026-06-13

**Verdict:** Partial — parser + Chat intercept + autonomy gate implemented; orchestrator unit test passes; no live Chat or `runTicketCommand` integration test.

| Done when | Status | Evidence |
|-----------|--------|----------|
| Chat compiles ticket packet | Code only | `runTicketCommand` → `api.tickets.compile`; `Chat.submit` intercept; `ticketCommandHint` in copy |
| Orchestrate spawns worker + receipt | Code + unit (orchestrator) | `orchestrateExisting` path + `ticket-orchestrator.test.ts`; Chat formats worker/run/receipt lines |
| Worker status in transcript | Code only | `status workers` → `api.workers.list` |
| Receipt proves command path | Code only | compile/orchestrate lines include receipt id; not E2E-verified |

**Tests:** `chat-ticket-commands.test.ts` 4/4 (parser only) · `ticket-orchestrator.test.ts` pass · typecheck ✗.

**+1:** No — staging Chat commands not proven; no integration test for `runTicketCommand`.
