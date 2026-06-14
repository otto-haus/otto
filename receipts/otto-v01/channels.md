# Receipt — Channels (Otto v0.1)

- **What changed:** `channels/channels.yaml` contract, `ChannelStore`, desktop Channels pane with honest enabled/disabled + approval-required badges.
- **Demo:** none (no live Discord send in v0.1)
- **Test command/output:**
  ```sh
  bun test ./apps/desktop/electron/channel-store.test.ts
  # 1 pass — loads discord + desktop entries; discord requires approval to send
  ```
- **Manual verification (staging):** Channels pane → `storage: files` pill → discord-main `disabled` + approval badge → desktop-chat `enabled`.
- **Known limitations:** Live Discord bot deferred (020). `discord-main.enabled: false`. No outbound send receipts until send path exists.
- **Approval status:** ☐ pending Sebastian.
