# 002 — Settings + Letta Connection

Status: done
Owner: Claude
Priority: P0
Depends on: none

## Outcome

User can connect Otto to Letta from Settings and see truthful readiness.

## Scope

- Settings screen.
- Letta API key / endpoint / agent ID config.
- Local config at `~/.otto/config.json` or current app equivalent.
- Key storage path that works for packaged app launch.
- Readiness checks.

## Done when

- Finder-launched app does not depend on shell env.
- Missing key shows clear setup action.
- Invalid key/agent shows exact error.
- Valid config marks Letta connected.
- Chat only unlocks after real readiness succeeds.

## Proof

- HQ: 001 Connected Settings
- Smoke: `/Users/seb/.codex/admin/otto-001-connected-settings-smoke-20260614T023015Z.json`
- Worktree: `apps/desktop/electron/settings-store.ts`, `readiness-store.ts`
- Verified: Finder launch uses `~/.otto/config.json`; readiness gates chat (2026-06-13)
