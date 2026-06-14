# 058 — Craft P1: Runtime Robustness Pack

Owner: Cursor
Priority: P1
Depends on: 045, 039
Release bucket: v0.1 craft

## Outcome

Craft punchlist P1 items shipped: unified IPC types, guarded `webContents.send`, ConnectLetta error surfacing, env-precedence reconnect fix, single status→pill mapper.

## Why this matters

Prevents drift and silent failures as WS transport (039) lands.

Source: `docs/otto-craft-punchlist.md` P1 section.

## Scope

- Import shared types in renderer from `electron/shared/types.ts`
- Guard destroyed window in runner hot paths
- ConnectLetta catch + user-visible error
- Recompute `LETTA_*` env on reconnect when Settings change
- Collapse `statusPill` / `readyPill` / `codePill` to one map
- Remove dead `api.config` bridge OR wire it (pick one; document)

## Out of scope

- Full CSS token refactor (P1/P2 house-style items can be 057 follow-up)

## Done when

- Typecheck passes with shared types
- Forced connection failure shows reason in Settings
- Unit tests for status mapping
- No regression on 045 permission modal

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test ./apps/desktop/electron/*.test.ts
```

## Blocker log

Leave blank unless blocked.
