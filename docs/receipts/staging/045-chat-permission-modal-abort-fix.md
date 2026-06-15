# Staging receipt — 045 Chat permission modal + abort

**Issue:** [#71](https://github.com/otto-haus/otto/issues/71)  
**Date:** 2026-06-14 (rev11 — smoke simulate modal capture)  
**App:** `/Applications/otto-staging.app` only (never mutate canonical `otto.app`)

## Transport + renderer unit proof

```sh
bun test ./apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts
bun test ./apps/desktop/electron/runtime-transport/permission-round-trip.test.ts
bun test ./apps/desktop/src/surfaces/chat-permission-modal.test.ts
task smoke:permission
```

| Done when | Proof |
|-----------|-------|
| Tool gate emits permission request | `otto:permission` IPC before resolve (`sdk-subprocess-transport.test.ts`) |
| Deny / timeout completes turn | Auto-deny on timeout; deny via `resolvePermission` |
| Approve resumes execution | `resolvePermission answers pending tool gate` |
| Abort clears pending + terminal | `abort rejects pending permission and emits terminal result` |
| No `conversation=default` smoke | `SMOKE_MODE` guard in transport `init()`; disposable conv in round-trip test |
| Chat modal wiring | `chat-permission-modal.test.ts` — `onPermission` → `Modal`/`PermissionCard` → `permission.respond` |
| Staging modal visible | `otto:smoke:trigger-permission` (OTTO_SMOKE=1) → CDP in `otto-staging-rev10-proof.cjs` |

Renderer wiring: `Chat.tsx` `api.onPermission` → `Modal`/`PermissionCard` → `api.permission.respond`.

## Staging modal capture (smoke simulate — no live tool execution)

Safe staging proof uses `window.otto.smoke.triggerPermission()` instead of a consequential tool gate during a live chat turn:

```sh
# After task staging:build (or deploy-staging.sh) with OTTO_SMOKE=1 bundle:
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev10-proof.cjs
```

Receipt artifacts (modal captured):

- `docs/receipts/staging/staging-rev10-proof-20260614082205.json` → `tickets.045.modalCaptured: true`
- `docs/receipts/staging/045-permission-modal-rev10-20260614082205.png`

## Full gate

```sh
bun run typecheck
bun test
bun run verify:v0
```
