# 056 — System Surfaces Ship (Skills · Tickets · Channels · Workers)

Owner: Cursor
Priority: P1
Depends on: 054, 055
Release bucket: v0.1 system

## Outcome

Skills, Tickets, Channels, and Worker stores/surfaces are **reviewed, tested, and ship-checked** — not only present in a dirty working tree.

## Why this matters

Audit lists these as Partial with large uncommitted diff. Each needs a formal Done-when like 001–018 wave.

## Scope

- `skill-store`, `ticket-store`, `ticket-orchestrator`, `channel-store`, `worker-store` tests green
- Panes: Skills, Tickets, Channels wired with file/live pills honest
- `readiness.json` / Settings rows match (038)
- `docs/v1/SHIP_CHECKS/` stubs updated for tickets/channels/skills

## Out of scope

- Discord live bot (020)
- Skills library expansion (066)
- Chat orchestration (049)

## Done when

- Each surface: load, empty, error paths proven in staging
- Skipped loader reasons visible (037)
- Orchestrate-without-recompile (035) verified
- One smoke receipt per surface under `receipts/otto-v01/`

## Verification

```sh
bun test ./apps/desktop/electron/skill-store.test.ts \
  ./apps/desktop/electron/ticket-store.test.ts \
  ./apps/desktop/electron/channel-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
