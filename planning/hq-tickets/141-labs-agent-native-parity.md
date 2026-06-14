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

- [ ] Agent can read labs state via preload API (documented with example)
- [ ] Agent can enable `knowledge_cognee` without opening Settings (test proves IPC path)
- [ ] No Labs-only logic trapped exclusively in React event handlers
- [ ] Reviewer +1 from agent-native lens

## Verification

```sh
cd /Users/seb/Code/otto
bun test ./apps/desktop/electron/config-store.test.ts
# Optional staging: scripts that call labs via CDP evaluate on window.otto
```

## Blocker log

Leave blank unless blocked.
