# Safe reset + graceful shutdown — operator runbook

Fixes [#576](https://github.com/otto-haus/otto/issues/576). In-app surfaces: **Settings → Diagnostics** and **Settings → System health**.

Related: PR #529 (graceful shutdown), #524 (WS scorecard), [`docs/runtime-transport.md`](../../runtime-transport.md).

## When to use what

| Situation | Action |
|-----------|--------|
| Normal end of day | **Cmd+Q** (or otto → Quit). otto stops the runtime, clears the session marker, and exits cleanly. |
| Force-quit, sleep mid-turn, or hung Chat after relaunch | **Settings → Diagnostics → Safe reset**. Stops runtime, clears unsent queue + session tool allowances, reconnects. |
| Blank Chat, stuck queue, or lingering WS child after unclean exit | Same — **Safe reset**. Preserves `~/.otto` config, threads, receipts, and Letta agent memory. |
| System health shows **Last shutdown: warn** | One-click **Safe reset** on that row, or open Diagnostics. |

## In-app paths

1. **Settings → System health** — live checks include **Last shutdown**. A warn row means the prior session left a stale session marker; use the inline Safe reset button.
2. **Settings → Diagnostics** — operator copy for Cmd+Q vs Safe reset, dirty-shutdown banner when applicable, export bundle, and Safe reset section.

## Session marker (support)

otto writes `~/.otto/session-active` while running. Graceful quit (`before-quit`) removes it via `markCleanShutdown()`. If the process is killed (Force Quit, `kill -9`, crash), the marker survives and the next launch surfaces the dirty-shutdown warning until Safe reset or a clean Cmd+Q cycle completes.

Never edit live `/Applications/otto.app` during agent proof. Use staging or a disposable bundle:

```sh
cd /Users/seb/Code/otto
task staging:build   # or OTTO_STAGING_REQUIRE_MAIN=0 task staging on a branch
OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging task smoke:staging:dirty-shutdown
```

Manual staging check (human):

1. Open `/Applications/otto-staging.app` (isolated profile).
2. Force-quit from Activity Monitor or `kill -9` on the otto PID.
3. Relaunch → **Settings → Diagnostics** shows unclean shutdown banner.
4. **Safe reset** → toast confirms; banner clears; Chat can reconnect.

## Verification (agents)

```sh
bun test apps/desktop/electron/shutdown-lifecycle.test.ts
bun test apps/desktop/electron/shutdown-coordinator.test.ts
bun test apps/desktop/electron/system-health.test.ts
bun run --cwd apps/desktop typecheck
```

Playwright (disposable bundle, never live otto.app):

```sh
bun run --cwd apps/desktop app:dir
OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging node scripts/otto-staging-dirty-shutdown-smoke.cjs
```
