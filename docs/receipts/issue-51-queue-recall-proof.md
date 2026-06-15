# Issue #51 — queued message recall proof

## Scope

Verify queued messages can be recalled into the composer without accidental loss.

## Preconditions

- otto desktop dev or staging (`task electron` / `task staging`) — never `/Applications/otto.app`.
- Runtime connected on a disposable thread (not `conversation=default`).

## Steps

1. Open Chat on a thread with runtime **ready**.
2. Send a message that keeps the assistant **busy** (or use a slow model).
3. While busy, type a follow-up in the composer and press **Tab** to queue it.
4. Confirm the queue strip shows the waiting row.
5. Click **Recall** (or click the row preview).
6. Confirm:
   - Composer fills with the queued text.
   - Queue row remains visible and is highlighted (recalled state).
   - Toast: “Recalled to composer. Still queued until you send or remove.”
7. Edit the text, press **Tab** again.
8. Confirm the old queue row is replaced (no duplicate) and the edited message sends when the turn completes.

## Attachment variant (optional)

1. Queue a message with an attached image.
2. Recall it.
3. Confirm attachment tray repopulates and the footer paths match the queued payload.

## Automated

```sh
bun test ./apps/desktop/src/chat/queue-storage.test.ts
```

Pass: `composerDraftFromQueueText` splits body + attachment refs.

## Result

- [ ] Manual steps run on staging/dev
- [x] Unit tests pass in CI
