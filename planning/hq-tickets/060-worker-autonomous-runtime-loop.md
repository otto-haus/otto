# 060 — Worker Autonomous Runtime Loop

Owner: Codex
Priority: P2
Depends on: 049, 051, 039
Release bucket: vNext autonomy

## Outcome

Temporary workers can execute a **bounded ticket slice** with stop conditions, receipts, and review gate — not only spawn records.

## Why this matters

Autonomy Partial: WorkerStore exists; no autonomous runtime loop. Closes "workers don't auto-execute Letta slices."

## Scope

- Worker lifecycle: spawn → run Letta session in worktree → checkpoint → stop on AC/budget/door
- Integrate 051 review gate before done
- Autonomy evaluates actions during worker run
- Trace + receipt per worker turn

## Out of scope

- Multi-worker fan-out beyond policy limits
- Unsupervised merge to main

## Done when

- Disposable ticket runs worker to completion or blocked door with receipt
- Reviewer +1 required for done transition
- Worktree isolated per ticket policy
- Failure writes blocked receipt not silent exit

## Verification

```sh
bun test ./apps/desktop/electron/worker-store.test.ts
bun test ./apps/desktop/electron/ticket-orchestrator.test.ts
```

## Blocker log

Leave blank unless blocked.
