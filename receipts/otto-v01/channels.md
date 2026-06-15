# Receipt — Channels (Otto v0.1)

- **What changed:** `channels/channels.yaml` contract, `ChannelStore`, desktop Channels pane with honest enabled/disabled + approval-required badges.
- **Demo:** none (no live Discord send in v0.1)
- **Test command/output:**
  ```sh
  bun test ./apps/desktop/electron/channel-store.test.ts
  # 1 pass — loads discord + desktop entries; discord requires approval to send
  ```
- **Manual verification (staging):** Channels pane → `storage: files` pill → discord-main `disabled` + approval badge → desktop-chat `enabled`.
- **Staging proof:** `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` (`tickets.056.ok: true`); screenshot `docs/receipts/staging/056-channels-20260614143512.png`
- **Known limitations:** Live Discord bot deferred (020). `discord-main.enabled: false`. No outbound send receipts until send path exists.
- **Approval status:** ☐ pending Sebastian.
