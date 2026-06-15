# Receipt — Tickets (Otto v0.1)

- **What changed:** Desktop `TicketStore` (compile, list, status), `TicketOrchestrator` (worktree workers, orchestrate-existing), Tickets pane with compile/orchestrate forms, IPC handlers.
- **Demo:** covered in autonomy/desktop demos; no dedicated tickets mp4
- **Test command/output:**
  ```sh
  bun test ./apps/desktop/electron/ticket-store.test.ts \
    ./apps/desktop/electron/ticket-orchestrator.test.ts
  # 2 pass — compile writes ticket.yaml + receipt; orchestrateExisting reuses without re-compile
  ```
- **Manual verification (staging):** Tickets pane → compile bounded slice → receipt id in message bar → orchestrate → worker + run ids → re-orchestrate existing ticket.
- **Staging proof:** `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` (`tickets.056.ok: true`); screenshot `docs/receipts/staging/056-tickets-20260614143512.png`
- **Known limitations:** Letta `/ticket` extension CLI parity deferred (130). Path/stop enforcement is compile-time spec, not runtime sandbox.
- **Approval status:** ☐ pending Sebastian.
