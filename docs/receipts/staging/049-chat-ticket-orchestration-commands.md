# Staging receipt — 049 Chat ticket orchestration

**Date:** 2026-06-14 (rev9)  
**Build:** `ship/v0.3-integration` @ `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Unit verification

```sh
bun test ./apps/desktop/electron/chat-ticket-commands.test.ts
bun test ./apps/desktop/electron/ticket-orchestrator.test.ts
```

## Staging Chat transcript (rev9)

**Manifest:** `staging-rev8-proof-20260614070035.json`

- Command: `compile ticket rev8-proof Staging rev8 ticket orchestration proof capture`
- Transcript includes compile receipt (`transcriptHasCompile: true`)
- Receipt: `receipt-0b222e29-fdc5-45f5-a507-a77db2ce2fff`
- Packet: `~/.codex/admin/otto-staging/otto-home/tickets/rev8-proof/worker-packet.md`

**Screenshot:** `049-chat-ticket-compile.png`

## Full gate

```sh
bun test
bun run verify:v0
```
