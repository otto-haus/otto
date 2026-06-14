# 141 — Labs Gate: Agent-Native Parity

Owner: Cursor
Implementer model: Composer 2.5 Fast
Priority: P1
Depends on: 137
Release bucket: v0.1 functional ship — **agent-native**

## Outcome

Anything a user can do with Labs toggles in Settings, an agent can do via the same IPC surface — no UI-only gates.

## Why this matters

Otto is agent-native. If Labs is Settings-only, agents cannot help operators enable Knowledge or run culture export during a session.

## Scope

- Document Labs IPC in `apps/desktop/electron/preload.ts` JSDoc or `docs/v1/labs.md` **Agent API** section
- Ensure `otto:labs:get` / `otto:labs:set` accept the same shape the Settings UI uses
- Readiness / `gen-readiness.mjs`: optional row “Labs master” status (informational, not required for Ship ready)
- Smoke script or unit test: invoke labs set from Node via exposed test hook OR document `window.otto.labs.set` for staging scripts
- Verify **Cut** tier surfaces are not reachable via IPC routes (no cloud deploy shortcuts)

## Non-goals

- New MCP servers for Labs
- Auto-enabling Labs without human toggle (default must stay off)

## Done when

- [x] Agent can read labs state via preload API (documented with example)
- [x] Agent can enable `knowledge_cognee` without opening Settings (test proves IPC path)
- [x] No Labs-only logic trapped exclusively in React event handlers
- [ ] Reviewer +1 from agent-native lens

## Verification

```sh
cd /Users/seb/Code/otto
bun test ./apps/desktop/electron/config-store.test.ts
# Optional staging: scripts that call labs via CDP evaluate on window.otto
```

## Blocker log

Leave blank unless blocked.

## Execution receipt (ship/functional-labs)

**Branch:** `ship/functional-labs` · **Date:** 2026-06-14 · **Swarm:** 3 agent 1/3

| Done when | Proof |
|-----------|-------|
| Read labs via preload | `docs/v1/labs.md` Agent API + `preload.ts` JSDoc on `labs.get` / `labs.set` |
| Enable `knowledge_cognee` via IPC | `labs-config.test.ts` — `persistLabsIpcSet` mirrors `otto:labs:set` |
| Settings-equivalent shape | `config-store.test.ts` + Settings full-object round-trip test |
| No UI-only gate | `LabsContext.tsx` already calls `ottoApi().labs.set` (unchanged) |
| Cut tier IPC guard | `labs-ipc-guard.test.ts` + `surface-tiers.test.ts` (no `cut` nav surfaces) |
| Readiness row (optional) | `gen-readiness.mjs` — informational `Labs master` when local config opt-in |

**Files:** `docs/v1/labs.md`, `apps/desktop/electron/preload.ts`, `apps/desktop/electron/ipc.ts`, `apps/desktop/electron/labs-config.ts`, `apps/desktop/electron/labs-config.test.ts`, `apps/desktop/electron/labs-ipc-guard.test.ts`, `apps/desktop/electron/config-store.test.ts`, `apps/desktop/src/surface-tiers.test.ts`, `apps/desktop/scripts/gen-readiness.mjs`

**Verified:**

```sh
bun test ./apps/desktop/electron/config-store.test.ts ./apps/desktop/electron/labs-config.test.ts ./apps/desktop/electron/labs-ipc-guard.test.ts ./apps/desktop/src/surface-tiers.test.ts
bun run verify:v0  # 5/5 pass
```

## Reviewer +1 (agent-native)

**Requested:** independent reviewer (not implementer) — confirm IPC docs match preload, tests cover Settings-equivalent persist path, and no Cut-tier deploy IPC exists.

**Implementer self-check:** Labs toggles are only persisted via `otto:labs:set` → `applyLabsConfigPatch` → `config.json`; no parallel React-only write path.

**Verdict:** pending independent +1
