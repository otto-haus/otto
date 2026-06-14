# Staging receipt — 045 Chat permission modal + abort

**Date:** 2026-06-14 (rev4)  
**Build:** `ship/v0.3-integration`  
**App:** `/Applications/otto-staging.app` only

## Deploy

```sh
bash apps/desktop/scripts/deploy-staging.sh
```

## Unit verification (substitutes for live modal E2E)

Live permission-modal screenshot is impractical without a consequential tool gate during a chat turn. Unit layer proves the full transport + renderer contract:

```sh
bun test ./apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts
```

| Done when | Unit proof |
|-----------|------------|
| Tool gate emits permission request | `otto:permission` IPC sent before resolve |
| Deny / timeout completes turn | Auto-deny on timeout; deny via `resolvePermission` |
| Approve resumes execution | `resolvePermission answers pending tool gate` |
| Abort clears pending + terminal | `abort rejects pending permission and emits terminal result` |
| No `conversation=default` smoke | `SMOKE_MODE` guard in `init()` |

Renderer wiring: `Chat.tsx` `api.onPermission` → `Modal`/`PermissionCard` → `api.permission.respond`.

## Staging runtime

- `runtime_ready=true` in prior `staging-proof-20260614061449.json`
- Live modal screenshot **not** captured — unit tests are the honest proof for this ticket

## Full gate

```sh
bun test   # 116 pass
bun run verify:v0   # 5/5 pass
```
