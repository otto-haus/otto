# Receipt: #283 Terminal surface

**Issue:** [otto-haus/otto#283](https://github.com/otto-haus/otto/issues/283)

## Before

- No Terminal nav item or `#terminal` hash route.
- No IPC to open a local shell from the desktop app.

## After

- Workspace nav includes **Terminal** (`SurfaceId: 'terminal'`).
- `#terminal` renders `Terminal.tsx` with workspace root and **Open in Terminal**.
- Electron IPC `otto:terminal:open` spawns the platform default terminal at the resolved repo root (`OTTO_ROOT` or nearest `.git` parent).

## Verify

```sh
cd apps/desktop && bun test electron/open-terminal.test.ts
bun run typecheck
bun test
```

## Note

Embedded PTY (`node-pty` + xterm) is intentionally deferred — this ships the entry point and external spawn path first.
