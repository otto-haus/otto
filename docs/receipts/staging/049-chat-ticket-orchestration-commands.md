# Staging receipt — 049 Chat ticket orchestration

**Date:** 2026-06-14 (rev11)  
**Issue:** [#74](https://github.com/otto-haus/otto/issues/74)  
**App:** `/Applications/otto-staging.app` only (disposable smoke conversations)

## Unit verification

```sh
bun test ./apps/desktop/electron/chat-ticket-commands.test.ts
bun test ./apps/desktop/electron/ticket-orchestrator.test.ts
bun test ./apps/desktop/src/surfaces/chat-composer-readiness.test.ts
bun run --cwd apps/desktop typecheck
```

## Done-when proof

| Criterion | Evidence |
|-----------|----------|
| Compile without re-compile overwrite | `chat-ticket-commands.test.ts` compile-existing guard; rev10 transcript `049-chat-ticket-commands-rev10-20260614074028.json` |
| Orchestrate spawns worker + receipt | `staging-hygiene-proof-20260614143512.json` → `worker_20260614_f6b33db1`, gate receipt `receipt-52ca1492-fff8-4799-811f-8ef94a30c4e1`; screenshot `049-orchestrate-20260614143512.png` |
| Worker status in transcript | rev10 JSON + hygiene `workerCount: 1` |
| Chat empty-state command hint | `chatCopy.ticketCommandHint` in `Chat.tsx` when runtime ready |

## Staging manifests

- Compile/orchestrate/status: `049-chat-ticket-commands-rev10-20260614074028.json`
- Hygiene orchestrate gate: `staging-hygiene-proof-20260614143512.json`

## Full gate

```sh
bun run typecheck
bun test
bun run verify:v0
```
