# 020 — Discord Approval Bridge

Owner: Cursor
Priority: P2
Depends on: 016, 045, 048, 056
Release bucket: vNext channels

**Unpark when:** Chat permission modal (045) and Channels surface (056) shipped; Curation proposals work from Chat (048).

## Outcome

Otto can reach Sebastian off-desktop for status, blockers, notes, and approvals.

## Scope

- Discord bot/bridge (local config in `channels/channels.yaml`).
- Status messages.
- Field notes.
- Approval prompts mapped to Curation/permission records.
- Receipt linking.
- Outbound approval-gated per channel policy.

## Done when

- Otto asks for a consequential approval in Discord.
- Reply creates a scoped approval receipt linked to proposal id.
- Work resumes or stays blocked based on the answer.
- Discord is not treated as database, memory, or authority.
- Files remain source of truth.

## Verification

```sh
bun test ./apps/desktop/electron/channel-store.test.ts
```

## Blocker log

Leave blank unless blocked.
