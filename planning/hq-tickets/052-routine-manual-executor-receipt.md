# 052 — Routine Manual Executor + Receipt

Owner: Cursor
Priority: P1
Depends on: 012, 013
Release bucket: v0.1 routines

## Outcome

One-off Routine trials run from Desktop with a **Run + Receipt** — Practices bundled execute manually before any scheduler exists.

## Why this matters

Routines one-pager: propose + one-off trials; recurring activation is a door. Nothing runs today except manual UI stub.

## Scope

- `RoutineStore.runManual(routineId)` executes declared practice bundle (documented steps or invokes practice CLI)
- Writes run record + receipt JSON
- Recurring activation still gated (Curation proposal required)
- Routines surface: Run trial button → receipt link

## Out of scope

- Cron/launchd scheduler
- Letta recurring cron
- Auto-approve recurring routines

## Done when

- `morning` or `ai-frontier-review` trial produces receipt artifact
- Recurring flag cannot run without approval record
- Unit test for receipt emission
- Staging click path proof

## Verification

```sh
bun test ./apps/desktop/electron/routine-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
