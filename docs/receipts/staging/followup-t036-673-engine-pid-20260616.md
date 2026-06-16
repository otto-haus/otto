# T036 — #673 engine PID wiring + kill-mid-session smoke

**Date:** 2026-06-16  
**Authority:** PR master · isolated worktree  
**Base:** `origin/main` @ **`2051ae56`**

## Slice

Wire `setEnginePid` after embedded SDK init via `resolveSdkSubprocessPid(session)`; clear on transport close/restart. Commit reusable `scripts/otto-staging-kill-mid-session-smoke.cjs`.

## Held

| Gate | Status |
|------|--------|
| **#670** | **OPEN** — do not close until Sebastian plan-gate approval |
| **v0.1.7 cut** | **NOT ready** |
| **#673 remainder** | mid-turn send after kill; `restartCount` on recoverable errors in smoke |

## Verify

```sh
bun test apps/desktop/electron/runtime-transport/embedded-engine-supervisor.test.ts
bun test apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts
```
