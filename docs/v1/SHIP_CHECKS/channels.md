# Ship Check — Channels

## Spec promise

Channels are communication surfaces. Discord is v0/v1 backend: mobile and ambient console, not source of truth.

## Required file contract if shipping

- [x] Channel type exists in core.
  - Evidence: `packages/core/src/types.ts` — `Channel`, `ChannelKind`

- [x] Channel config exists.
  - Evidence: `channels/channels.yaml` — discord-main (disabled) + desktop-chat (enabled)

- [x] Discord docs/templates exist.
  - Evidence: `channels/README.md`; config comments in `channels.yaml`

- [x] Approval gate for outbound messages exists.
  - Evidence: `requires_approval_to_send: true` on discord-main; `defaults.approval_required_for_outbound: true`

- [~] Channel receipts exist.
  - Partial: `Run.delivered_to` type field exists; no live send path yet → no delivery receipts

## Required runtime behavior if shipping

- [x] File-backed channel list in desktop (scaffold + contract).
  - Evidence: `ChannelStore`; IPC `otto:channels:list`; Channels pane with file/live pill

- [ ] Live read/send via Discord.
  - Gap: Discord bot runtime deferred (020); `discord-main.enabled: false`

- [x] Files remain source of truth.
  - Evidence: `channels/channels.yaml` canon; pane shows `configPath`

## v0.1 decision

- [x] File contract + desktop surface ship; live Discord deferred.
  - Evidence: `RELEASE_CHECKLIST.md`; discord channel `enabled: false`

## Staging smoke (desktop pane)

- Load: Channels pane reads `channels/channels.yaml`
- Empty: missing file → built-in defaults or empty list with path hint
- Disabled: discord-main shows `disabled` pill + approval-required badge
- Enabled: desktop-chat shows `enabled` pill
- File/live pill: `storage: files` chip visible

## Automated verification

```sh
bun test ./apps/desktop/electron/channel-store.test.ts
```

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- [ ] Not done — missing work required

## Ship decision

**Ship in v0.1** — file-backed contract + desktop surface; live Discord bot **deferred**.

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
