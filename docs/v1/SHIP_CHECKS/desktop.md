# Ship Check — Desktop

## Implementation status (2026-06-13)

Ship decision: **Ship as Proposed**

- [x] Canonical app in `apps/desktop` — worktree path above
- [x] Sidebar: Chat, Charters, Standards, Practices, Routines, Curation, Receipts, Autonomy, Settings
- [x] Chat Send gated on Letta readiness — smoke `otto-002-chat-send-smoke-20260614T023917Z.json`
- [x] `bun test ./electron/*.test.ts` → 25 pass; typecheck pass
- [~] Electron packaged app built in worktree; not promoted to live `/Applications/otto.app`
- [ ] `docs/desktop-convergence.md` not written in worktree
- [ ] `receipts/otto-v01/desktop.md` not refreshed
- [ ] Demo video not recorded

## Spec promise

Otto Desktop is the workspace over all surfaces. It reads files as truth and shows status, queues, receipts, and decisions.

## Required file contract

- [ ] Canonical app lives in `apps/desktop`.
- [ ] Any standalone Electron app is documented as reference-only or ported.
- [ ] Desktop convergence is documented in `docs/desktop-convergence.md`.

## Required UX

- [ ] Left sidebar surfaces: Chat, Charters, Standards, Practices, Routines, Curation, Receipts, Autonomy, Settings.
- [ ] Chat/workspace is primary.
- [ ] No visible Vinny/Veto/Cockpit/.veto-os in normal UI.
- [ ] Debug is hidden by default.
- [ ] Runtime status is shown cleanly.
- [ ] Surfaces distinguish real/file-backed vs prototype/read-only.

## Required runtime behavior

- [ ] App launches locally.
- [ ] Sidebar navigation works.
- [ ] Practices surface reads generated real `practices.json`.
- [ ] Chat Send is disabled until runtime ready, or clearly marked prototype.
- [ ] No red stack on load.
- [ ] If Electron runtime is included: SDK init succeeds with `memfs:false` or cleanly reports unavailable.

## Required commands

```sh
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
bun --cwd apps/desktop run dev
# If Electron is included:
env -u ELECTRON_RUN_AS_NODE bun --cwd apps/desktop run electron:dev
```

## Required receipt

- [ ] `receipts/otto-v01/desktop.md` states exact command, what appears, interactive vs read-only, runtime status, and broken/missing pieces.

## Required demo

- [ ] `demo/out/otto-v01-desktop.mp4` reflects actual desktop status.
- [ ] If runtime is not wired, demo says preview shell / not live runtime.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
