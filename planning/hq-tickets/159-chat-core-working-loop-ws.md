# 159 — Chat Core Working Loop: WS Letta + Conversations

Owner: Codex
Priority: P0
Depends on: 039, 045, 046, 151, 157, 158
Release bucket: v0.1 functional ship — **chat works**
Label: Ship blocker · Chat core
Recommended implementer: highest-reasoning available model, not the fast craft lane.

## Outcome

otto reaches the first honest functional product bar:

```txt
Chat works.
Conversations work.
Models can be switched.
Messages can be queued and steered.
Threads can be pinned, recent, and archived.
Runtime path is WS Letta.
```

This ticket is not trying to make every workspace surface perfect. Everything outside Chat, Settings, and the conversation sidebar may stay `soon`.

## Current situation

Recent work landed many pieces, but they are still not one proven product loop:

- **046** introduced local thread rows, per-thread message storage, and IPC, but earlier reviews called out missing two-thread live proof.
- **151** hardens unsent queue storage, but queued messages still need a live busy-turn proof.
- **157** handles invalid model preset fallback, but the product must prove model switching against the live Letta model registry, not stale hardcoded handles.
- **158** normalizes duplicate thread IDs, but the sidebar/thread store still needs an end-to-end lifecycle pass.
- The runtime currently has SDK, WS, and auto modes. For this ticket, **Done requires WS** (`effectiveTransport: websocket local`). SDK fallback can exist, but it does not satisfy this ticket.

Sebastian’s explicit bar:

> Not perfect. Just something that works.

## Product scope

### Must work

- Chat send/receive with a live local Letta agent.
- New conversation/thread creation.
- Thread switching from the sidebar.
- Pinned conversations section.
- Recent conversations section.
- Archive conversation/thread action.
- Model switching using Letta-visible model handles.
- Queued messages while the assistant is busy.
- Steering messages: operator can add a follow-up/steering message during an active turn; it is queued, visible, and sent into the same thread after the current turn finishes.

### May remain `soon`

- Charters, Standards, Practices, Routines, Curation, Receipts, Autonomy, Checks, Knowledge, Tickets, Channels.
- Cloud sync.
- Discord/Paperclip.
- Advanced worker loops.
- Perfect onboarding.

## Definitions

Use **conversation** in user-facing UI. Use **thread** for local implementation records only.

```txt
Conversation = what the operator sees in the sidebar.
Thread       = local index row persisted under OTTO_HOME.
Letta conversationId = runtime/backend conversation identifier when available.
```

## Implementation notes

- Prefer the existing thread store and IPC:
  - `otto:threads:list`
  - `otto:threads:create`
  - `otto:threads:switch`
  - `otto:threads:archive`
  - `otto:threads:pin`
  - `otto:threads:touch`
- Prefer the existing runtime supervisor, but make the accepted path WS:
  - `OTTO_RUNTIME_TRANSPORT=ws` is acceptable for staging proof.
  - If `auto` is used, the proof must show it promoted to `effectiveTransport: websocket local`.
  - If the WS promotion scorecard blocks `auto`, either complete the scorecard or run this ticket’s proof in explicit `ws` mode.
- Do not use `conversation=default` in smoke or staging proof.
- Do not make fake conversations or mock thread rows.
- Do not claim model switching works unless `session.initialize()` or equivalent runtime init succeeds after the model change and a real message sends.
- Do not solve this by forcing one hardcoded model. Read available Letta models where practical; otherwise handle invalid handles with an honest blocked state and a fallback that persists only after a successful connect.

## UX requirements

Sidebar:

- `Pinned` section is always present.
- `Recents` section is always present.
- Pinned conversations appear in `Pinned` and are removed from the normal Recents list, or are clearly not duplicated.
- Recent conversations are sorted by last activity.
- Archived conversations are hidden from Pinned/Recents by default.
- Archive action is visible enough to use, but not so prominent that it is easy to hit accidentally.
- Active conversation highlight moves immediately when clicked.

Chat:

- Composer is enabled only when runtime is ready.
- If runtime is not ready, the page says exactly what blocks chat and gives `Retry` + `Open Settings`.
- Header model picker shows the selected model and effort.
- Switching model reconnects or reinitializes the runtime and keeps the current conversation selected.
- Queued messages are compact, visible, retryable, dismissible, and not lost silently.
- Steering/follow-up messages added while busy are queued in order and sent after the current reply.

Archive:

- Archive current conversation removes it from Recents/Pinned.
- If the active conversation is archived, otto selects the next available recent conversation or creates a new empty conversation.
- Archived rows remain in the local index and can be included in a debug/show-archived list or test API.

## Done when

- [ ] With `OTTO_RUNTIME_TRANSPORT=ws`, staging reaches `ready: true` and `effectiveTransport: websocket local`.
- [ ] Create conversation A, send a message, receive a response.
- [ ] Create conversation B, send a different message, receive a response.
- [ ] Click A and B in the sidebar; each shows its own message history with no bleed-through.
- [ ] Reload/relaunch staging; active conversation, Pinned, and Recents restore.
- [ ] Pin conversation A; it appears in `Pinned` and stays there after relaunch.
- [ ] Unpin conversation A; it returns to Recents ordering.
- [ ] Archive conversation B; it disappears from default sidebar lists and remains archived in the local index.
- [ ] If the archived conversation was active, otto lands on a valid remaining conversation or a new empty one.
- [ ] Switch model at least once using a Letta-visible model handle; after the switch, send a real message successfully.
- [ ] Queue at least two messages while one turn is busy; both send in order after the active turn completes.
- [ ] Add one steering/follow-up message while busy; it remains visible as queued and sends into the same conversation.
- [ ] Queue failure path is honest: failed queued item remains retryable or dismissible, never silently dropped.
- [ ] No smoke/test uses Sebastian’s live `conversation=default`.
- [ ] Staging proof uses `/Applications/otto-staging.app` and isolated `OTTO_HOME`.
- [ ] Focused tests pass for thread lifecycle, archive, pin, queue, model fallback, and WS transport.
- [ ] Renderer and Electron typechecks pass.
- [ ] Execution receipt maps every Done-when item to proof.
- [ ] Independent reviewer +1.

## Required verification

```sh
cd /Users/seb/Code/otto

bun test ./apps/desktop/electron/thread-store.test.ts
bun test ./apps/desktop/electron/chat-message-keys.test.ts
bun test ./apps/desktop/src/chat/queue-storage.test.ts
bun test ./apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts
bun test ./apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task staging
```

Manual staging proof:

```txt
App: /Applications/otto-staging.app
Transport: WS / websocket local
Profile: isolated staging profile
Conversations: A + B
Proof: screenshots or JSON receipt for create, switch, pin, unpin, archive, model switch, queued send, steering send
```

Preferred receipt path:

```txt
docs/receipts/staging/159-chat-core-working-loop-ws-YYYYMMDDTHHMMSS/
```

## Out of scope

- Making non-chat workspace surfaces production-ready.
- Cloud or remote Letta.
- Perfect visual redesign.
- Extension CLI parity.
- Discord/Paperclip writes.
- Memory observatory beyond what is required for live Chat.
- Public release/tag/merge.

## Reviewer checklist

Reviewer must reject if any of these are true:

- Runtime proof used SDK fallback instead of WS.
- Chat only worked in one conversation.
- Thread switch changed the active highlight but not the displayed messages.
- Queue proof only covered failed storage, not busy-turn queued sends.
- Model switch only changed UI state and did not reconnect/send successfully.
- Archive only hid a row in the renderer without persisting `archived: true`.
- Proof used Sebastian’s live default conversation.
- Any Done-when item is checked without a command, receipt, screenshot, or exact manual proof note.

## Blocker log

Leave blank unless blocked. If blocked, preserve the exact failed runtime status, transport mode, model handle, agent id, base URL, and staging profile path.

## Progress receipt - 2026-06-14T15:23Z

Status: partial; ticket remains in root, not `_InReview`.

Feature reviewed: queued messages and steering/follow-up sends during active Chat turns.

Critique:

- Right: the UI already made busy-turn follow-ups visible as queue items instead of silently dropping them.
- Right: failed queued sends remain retryable/dismissible.
- Wrong: queue storage was app-global. A follow-up queued while conversation A was busy could later drain into whichever conversation was active after a sidebar switch.
- Wrong: the queue strip showed global pending items, so conversation B could display conversation A's unsent follow-up.
- Right fix for this slice: version queue storage to `otto.chat.queue.v3`, attach `threadId` to new queue items, show/retry/clear only active-conversation queue items, and drain only the next queued item matching `rt.activeThreadId`. Legacy v1/v2 items migrate as threadless and can still drain to the active conversation instead of being discarded.

Docs/best-practice context:

- Context7 React docs support reading latest async values through refs and using functional state updates for array state.
- React best-practices guidance supports versioned localStorage schemas and keeping transient async state narrow.
- Exa was not available through tool discovery in this session.

Files changed in this pass:

- `apps/desktop/src/chat/queue-storage.ts`
- `apps/desktop/src/chat/queue-storage.test.ts`
- `apps/desktop/src/surfaces/Chat.tsx`

Commands run:

```sh
bun test ./apps/desktop/electron/thread-store.test.ts
bun test ./apps/desktop/electron/chat-message-keys.test.ts
bun test ./apps/desktop/src/chat/queue-storage.test.ts
bun test ./apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts
bun test ./apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun run typecheck
git diff --check -- apps/desktop/src/chat/queue-storage.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/src/surfaces/Chat.tsx planning/hq-tickets/159-chat-core-working-loop-ws.md
task staging
```

Result: all commands passed on 2026-06-14.

Staging paths:

- Staging app: `/Applications/otto-staging.app`
- Isolated home: `/Users/seb/.codex/admin/otto-staging/home`
- Isolated otto home: `/Users/seb/.codex/admin/otto-staging/otto-home`
- Profile: `/Users/seb/.codex/admin/otto-staging/profile`
- Debug port: `9445`

Done-when coverage advanced:

- Queue at least two messages while one turn is busy: storage/UI now preserves active conversation ownership for queued items; live busy-turn proof still required.
- Add one steering/follow-up message while busy: queued follow-ups now carry the conversation thread ID and drain only back into that conversation; live WS proof still required.
- Queue failure path is honest: existing failed queue items remain retryable/dismissible, now scoped to the active conversation in the visible queue strip.
- Focused tests pass for queue storage, thread lifecycle, model fallback, and WS transport.
- Renderer and Electron typechecks pass.
- Staging refresh used `/Applications/otto-staging.app` and isolated staging paths.

Remaining required proof:

- Live WS runtime `ready: true` with `effectiveTransport: websocket local`.
- Manual staging proof for conversations A/B, no message bleed, relaunch restore, pin/unpin/archive lifecycle, model switch with a real send, busy-turn queued sends, and steering send.
- Independent reviewer for the completed ticket after every Done-when item has proof.
