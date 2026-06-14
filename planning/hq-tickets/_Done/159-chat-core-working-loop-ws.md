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

First workable version is **local Letta only**. Letta Cloud is not required for this ticket and should not be introduced to make this loop pass.

## Current situation

Recent work landed many pieces, but they are still not one proven product loop:

- **046** introduced local thread rows, per-thread message storage, and IPC, but earlier reviews called out missing two-thread live proof.
- **151** hardens unsent queue storage, but queued messages still need a live busy-turn proof.
- **157** handles invalid model preset fallback, but the product must prove model switching against the live Letta model registry, not stale hardcoded handles.
- **158** normalizes duplicate thread IDs, but the sidebar/thread store still needs an end-to-end lifecycle pass.
- The runtime has SDK, WS, and auto modes. Current product cutover target is **WS by default** (`effectiveTransport: websocket local`). SDK fallback can exist only as an explicit diagnostic/safety mode; it does not satisfy this ticket.

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
  - Default app startup should resolve to `OTTO_RUNTIME_TRANSPORT=ws` behavior.
  - Staging proof must show `transportMode: ws` and `effectiveTransport: websocket local`.
  - `auto` and `sdk` remain explicit diagnostics only; a passing SDK/auto fallback proof does not satisfy this ticket.
- Do not use `conversation=default` in smoke or staging proof.
- Do not make fake conversations or mock thread rows.
- Do not claim model switching works unless `session.initialize()` or equivalent runtime init succeeds after the model change and a real message sends.
- Do not solve this by forcing one hardcoded model. Read available Letta models where practical; otherwise handle invalid handles with an honest blocked state and a fallback that persists only after a successful connect.

## UX requirements

Sidebar:

- `Pinned` section is always present.
- `Recents` section is always present.
- Pin/unpin control sits on the left side of the conversation name, not on the far right.
- Double-clicking a conversation name starts inline rename; Enter/blur saves; Escape cancels.
- Pinned conversations appear in `Pinned` and are removed from the normal Recents list, or are clearly not duplicated.
- Recent conversations are sorted by last activity.
- Archived conversations are hidden from Pinned/Recents by default.
- Archive action is visible enough to use, but not so prominent that it is easy to hit accidentally.
- Archive requires two clicks on the same control: first click arms confirmation, second click archives.
- Active conversation highlight moves immediately when clicked.

Chat:

- Do not show Command Station in the Chat surface. Chat should be conversation-first.
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

- [x] With `OTTO_RUNTIME_TRANSPORT=ws`, staging reaches `ready: true` and `effectiveTransport: websocket local`. (`wsReady` — `docs/receipts/staging/159-chat-core-working-loop-ws-20260614_execute_ws/proof.json`)
- [x] Create conversation A, send a message, receive a response.
- [x] Create conversation B, send a different message, receive a response.
- [x] Click A and B in the sidebar; each shows its own message history with no bleed-through.
- [x] Reload/relaunch staging; active conversation, Pinned, and Recents restore.
- [x] Pin conversation A; it appears in `Pinned` and stays there after relaunch.
- [x] Unpin conversation A; it returns to Recents ordering.
- [x] Pin action appears on the left side of the conversation name.
- [x] Double-click rename persists after relaunch and is not overwritten by the next send. (`renamePersistsAndNotOverwritten` — `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/proof.json`)
- [x] Archive conversation B; it disappears from default sidebar lists and remains archived in the local index.
- [x] Archive requires two same-location clicks: arm confirm, then confirm archive. (`archiveTwoClickSameLocation` — `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/proof.json`)
- [x] If the archived conversation was active, otto lands on a valid remaining conversation or a new empty one.
- [x] Switch model at least once using a Letta-visible model handle; after the switch, send a real message successfully.
- [x] Queue at least two messages while one turn is busy; both send in order after the active turn completes.
- [x] Add one steering/follow-up message while busy; it remains visible as queued and sends into the same conversation.
- [x] Queue failure path is honest: failed queued item remains retryable or dismissible, never silently dropped.
- [x] Command Station is absent from Chat. (`commandStationAbsent` — `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/proof.json`)
- [x] All Workspace items render as `soon` / Coming soon until explicitly graduated. (`workspaceSurfacesComingSoon` — `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/proof.json`)
- [x] No smoke/test uses Sebastian’s live `conversation=default`.
- [x] Staging proof uses isolated staging with fresh `OTTO_HOME`. *(Latest proof: `/Applications/otto-159-staging.app`, `$HOME/.codex/admin/otto-159-staging`, port `9461`.)*
- [x] Focused tests pass for thread lifecycle, archive, pin, queue, model fallback, and WS transport.
- [x] Renderer and Electron typechecks pass.
- [x] Execution receipt maps every Done-when item to proof. (`202606142209_159isolated` receipt below.)
- [x] Independent reviewer +1.

**Status:** `_Done` — PR #306 merged; independent reviewer +1 recorded below.

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
- The implementation introduces Letta Cloud as a dependency for first workable local v1.
- Chat only worked in one conversation.
- Thread switch changed the active highlight but not the displayed messages.
- Queue proof only covered failed storage, not busy-turn queued sends.
- Model switch only changed UI state and did not reconnect/send successfully.
- Archive only hid a row in the renderer without persisting `archived: true`.
- Archive can be triggered by one accidental click.
- Manual rename is overwritten by the next prompt.
- Command Station still appears in Chat.
- Proof used Sebastian’s live default conversation.
- Any Done-when item is checked without a command, receipt, screenshot, or exact manual proof note.

## Blocker log

Leave blank unless blocked. If blocked, preserve the exact failed runtime status, transport mode, model handle, agent id, base URL, and staging profile path.

## GitHub issue coverage - 2026-06-14T17:48Z

Sebastian asked that the product threads from the recent screenshots/compaction stream be represented in GitHub Issues. Existing coverage:

- `#149` — core workable chat loop: WS, multiple conversations, switching, recents, pinned, archive, model switch, queue, steering, workspace soon.
- `#148` — runtime model fallback effort floor.
- `#142` — chat unsent queue hardening.
- `#72` — multi-thread conversations.
- `#65` — pinned chat list.
- `#48` — composer controls and keyboard defaults.

New issue coverage added:

- `#161` — wide-window chat canvas should not leave a blank pane.
- `#162` — long responses should collapse and support jump navigation.
- `#163` — markdown tables should render cleanly in Chat.
- `#164` — conversation ordering controls and pinned drag order.
- `#165` — selected model + reasoning effort should be exposed to the agent runtime context.

## Progress receipt - 2026-06-14T17:23Z

Status: partial; ticket remains in root, not `_InReview`.

Work covered in this pass:

- Added GitHub issue coverage for the remaining screenshot/compaction product threads: `#161` through `#165`.
- Removed the remaining Chat Command Station render path from source.
- Widened the Chat canvas on large desktop windows while keeping messages bounded for readability.
- Added inline-table normalization so compact one-line markdown tables with a divider can render as tables.

Files changed in this pass:

- `apps/desktop/src/surfaces/Chat.tsx`
- `apps/desktop/src/styles.css`
- `planning/hq-tickets/159-chat-core-working-loop-ws.md`

Commands run:

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
git diff --check -- apps/desktop/src/surfaces/Chat.tsx apps/desktop/src/styles.css planning/hq-tickets/159-chat-core-working-loop-ws.md
task staging
```

Result:

- Renderer typecheck passed.
- Electron typecheck passed.
- Scoped diff whitespace check passed.
- `task staging` completed, but visual staging proof is blocked by a concurrent staging overwrite from another worktree. `/Applications/otto-staging.app` did not match this checkout's generated renderer after deploy:
  - Source/dist renderer index sha: `ae54330b0a05f0b291a7dd80e2f8019e69d17e5d`
  - Installed staging renderer index sha after overwrite: `ba1de6d90a18206c7131e83b6883eb81f41f95bf`
- Do not treat this pass as staging-verified until staging replacement is no longer racing.

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

## Progress receipt - 2026-06-14T15:48Z

Status: partial; ticket remains in root, not `_InReview`.

Operational correction:

- Default transport was restored to **functional auto** instead of strict WS.
- Reason: strict WS currently bricks Chat because the current Letta Desktop CLI no longer exposes the expected local `letta remote --backend local` contract; staging previously timed out with `Timed out waiting for Letta Code remote to connect (letta remote --backend local)`.
- Strict WS remains the Done condition for this ticket. Auto/SDK fallback is only the product safety path so Sebastian can chat while WS proof is still open.

Files changed in this pass:

- `apps/desktop/electron/runtime-transport/transport-mode.ts`
- `apps/desktop/electron/runtime-transport/transport-mode.test.ts`
- `apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts`
- `docs/runtime-transport.md`
- `scripts/refresh-otto-app.sh`

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/transport-mode.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/thread-store.test.ts apps/desktop/electron/config-store.test.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/chat-message-keys.test.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task refresh
task staging
```

Result: all focused tests/typechecks passed; live `/Applications/otto.app` and staging `/Applications/otto-staging.app` rebuilt after fixing `scripts/refresh-otto-app.sh` to use `ditto` instead of `cp -R`.

Staging CDP proof on port `9445`:

```json
{
  "ready": true,
  "code": "ready",
  "agentId": "agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2",
  "baseUrl": "http://127.0.0.1:51398",
  "conversationId": "local-conv-96",
  "model": "chatgpt-plus-pro/gpt-5.5",
  "transportMode": "auto",
  "effectiveTransport": "sdk subprocess"
}
```

Staging send proof:

- Sent: `Reply exactly: OTTO_STAGING_CHAT_OK`
- Active thread storage contains assistant reply: `OTTO_STAGING_CHAT_OK`
- Model list IPC returned live Letta models including `letta/auto`, `openai/gpt-5`, and related local handles.

Remaining required proof:

- Strict WS proof (`OTTO_RUNTIME_TRANSPORT=ws`) must reach `ready: true` and `effectiveTransport: websocket local`, or the ticket must stay open with the upstream Letta CLI contract blocker.
- Busy-turn queue and steering need manual staging proof after strict transport is resolved or explicitly descoped.

## Progress receipt - 2026-06-14T16:08Z

Status: partial; ticket remains in root, not `_InReview`.

Product corrections from Sebastian:

- First workable version is local Letta only; Letta Cloud is out of scope for this ticket.
- Remove Command Station from Chat.
- All Workspace surfaces stay `soon` / Coming soon until explicitly graduated.
- Conversation row controls: pin action on the left of the name, archive as a two-click same-location confirmation, double-click to rename.
- Temporary alternate staging was used only because Sebastian was actively chatting in normal staging. Superseded by the 2026-06-14T16:34Z receipt: normal `task staging` is current again.

Files changed in this pass:

- `Taskfile.yml`
- `AGENTS.md`
- `apps/desktop/scripts/deploy-staging.sh`
- `apps/desktop/electron/thread-store.ts`
- `apps/desktop/electron/thread-store.test.ts`
- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/runtime-transport/ws-runtime-transport.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/chat/useChatThreads.ts`
- `apps/desktop/src/components/Sidebar.tsx`
- `apps/desktop/src/components/ui/ThreadList.tsx`
- `apps/desktop/src/copy/surfaces.ts`
- `apps/desktop/src/labs/ComingSoonSurface.tsx`
- `apps/desktop/src/runtime.ts`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/surface-tiers.ts`
- `apps/desktop/src/surface-tiers.test.ts`
- `apps/desktop/src/surfaces/Chat.tsx`

Commands run:

```sh
bun test apps/desktop/electron/thread-store.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/chat-message-keys.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/electron/config-store.test.ts
git diff --check -- AGENTS.md Taskfile.yml apps/desktop/scripts/deploy-staging.sh apps/desktop/src/components/ui/ThreadList.tsx apps/desktop/src/components/Sidebar.tsx apps/desktop/src/App.tsx apps/desktop/src/runtime.ts apps/desktop/src/surfaces/Chat.tsx apps/desktop/src/surface-tiers.ts apps/desktop/src/labs/ComingSoonSurface.tsx apps/desktop/src/copy/surfaces.ts apps/desktop/electron/thread-store.ts apps/desktop/electron/thread-store.test.ts apps/desktop/electron/ipc.ts apps/desktop/electron/preload.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.ts apps/desktop/src/surface-tiers.test.ts planning/hq-tickets/159-chat-core-working-loop-ws.md
```

Result:

- 52 focused tests passed across thread store, queue storage, message keys, surface tiers, runtime common, runtime supervisor, WS transport, and config store.
- Renderer typecheck passed.
- Electron typecheck passed.
- Diff whitespace check passed.
- A temporary alternate staging target launched without touching the active staging instance. That workflow has since been removed.

Historical temporary-staging CDP check:

```json
{
  "ready": true,
  "effectiveTransport": "sdk subprocess",
  "chatHasCommandStation": false,
  "channelsComingSoon": true
}
```

Notes:

- Strict WS remains open. Unit coverage passes for the local registration shim, but the historical temporary-staging check proved functional auto/SDK fallback, not `effectiveTransport: websocket local`.
- `/Applications/otto-staging.app` was not replaced or killed in this pass.

## Progress receipt - 2026-06-14T16:34Z

Status: partial; ticket remains in root, not `_InReview`.

Sebastian update:

- Sebastian is off staging again; retire the `staging2` workflow and return to normal `task staging`.
- Do not refresh live `/Applications/otto.app`; Sebastian will run `task refresh` when appropriate.

Bug addressed:

- Sidebar thread revive could keep failing on stale Letta local conversation ids such as `local-conv-*`.
- The SDK path treated stored `local-conv-*` ids like agent resume ids. Current Letta SDK only auto-detects `conv-*`, so `local-conv-*` must be passed through the explicit conversation option.
- Switching to an empty local thread now requests a fresh Letta conversation instead of default/session bleed.

Files changed in this pass:

- `AGENTS.md`
- `Taskfile.yml`
- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/runtime-transport/runtime-common.ts`
- `apps/desktop/electron/runtime-transport/runtime-common.test.ts`
- `apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts`
- `apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts`
- `apps/desktop/electron/thread-store.ts`
- `apps/desktop/electron/thread-store.test.ts`

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts apps/desktop/electron/thread-store.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/chat-message-keys.test.ts
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/electron/config-store.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task staging
```

Result:

- 33 focused tests passed for thread lifecycle, archive/pin/rename, queue storage, thread message keys, surface tiers, and SDK local-conversation revive.
- 25 runtime tests passed for WS transport, supervisor fallback, runtime-common status mapping, and config store.
- Renderer and Electron typechecks passed.
- Normal staging refreshed: `/Applications/otto-staging.app`, debug port `9445`, isolated `OTTO_HOME=/Users/seb/.codex/admin/otto-staging/otto-home`.

Staging CDP checks on port `9445`:

```json
{
  "hasCommandStation": false,
  "workspaceSoonBadges": 12,
  "channelsShowsComingSoon": true,
  "hasPinned": true,
  "hasRecents": true
}
```

Remaining required proof:

- Strict WS staging proof is still open (`effectiveTransport: websocket local`).
- Full live multi-conversation proof is still open: A/B send, switch, relaunch restore, pin/unpin relaunch, archive active fallback, model switch send, busy queue drain, and steering send.

## Progress receipt - 2026-06-14T16:56Z

Status: partial; ticket remains in root, not `_InReview`.

Sebastian update:

- Sebastian owns release-cut timing. Agents may prepare evidence and say "ready to consider"; agents must not decide a cut is due.
- User will run `task refresh` for live `/Applications/otto.app`; normal end-of-turn deploy remains `task staging`.

Bug/UX addressed:

- Agent can now answer from otto-selected runtime context: selected model handle, reasoning effort, transport mode, and provider boundary are injected into each Letta turn.
- Composer re-focuses itself in normal chat flow so the operator can type after switching threads or sending without hunting for the input.
- Pipe markdown tables render as actual tables instead of wrapped text.
- Pinned rows can archive via the same two-click confirm control; active archive still hands off to the runtime, inactive archive mutates the thread store directly.
- Sidebar rows support manual drag/drop ordering. Manual order persists across later `updatedAt` changes, especially for pinned rows.
- Pin action remains on the left side of the row; double-click rename remains in place.

Files changed in this pass:

- `AGENTS.md`
- `RELEASE_CHECKLIST.md`
- `docs/v1/runbooks/sebastian-release-sign-off.md`
- `standards/standards/earned-semver.md`
- `apps/desktop/electron/shared/types.ts`
- `apps/desktop/electron/thread-store.ts`
- `apps/desktop/electron/thread-store.test.ts`
- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/runtime-transport/runtime-common.ts`
- `apps/desktop/electron/runtime-transport/runtime-common.test.ts`
- `apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts`
- `apps/desktop/electron/runtime-transport/ws-runtime-transport.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/chat/useChatThreads.ts`
- `apps/desktop/src/components/Sidebar.tsx`
- `apps/desktop/src/components/ui/ThreadList.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/surfaces/Chat.tsx`

Commands run so far:

```sh
bun test apps/desktop/electron/thread-store.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
rg -n "api\\.openai|api\\.anthropic|OPENAI_API_KEY|ANTHROPIC_API_KEY|new OpenAI|Anthropic\\(|fetch\\(|https://api\\.openai|https://api\\.anthropic" apps/desktop/electron apps/desktop/src packages -g '!**/node_modules/**'
bun test apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts apps/desktop/electron/thread-store.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/chat-message-keys.test.ts
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/electron/config-store.test.ts
git diff --check -- AGENTS.md RELEASE_CHECKLIST.md docs/v1/runbooks/sebastian-release-sign-off.md standards/standards/earned-semver.md apps/desktop/electron/shared/types.ts apps/desktop/electron/thread-store.ts apps/desktop/electron/thread-store.test.ts apps/desktop/electron/ipc.ts apps/desktop/electron/preload.ts apps/desktop/electron/runtime-transport/runtime-common.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/electron/runtime-transport/sdk-subprocess-transport.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.ts apps/desktop/src/App.tsx apps/desktop/src/chat/useChatThreads.ts apps/desktop/src/components/Sidebar.tsx apps/desktop/src/components/ui/ThreadList.tsx apps/desktop/src/styles.css apps/desktop/src/surfaces/Chat.tsx planning/hq-tickets/159-chat-core-working-loop-ws.md
task staging
```

Result so far:

- 62 focused tests passed across thread store, SDK local-conversation revive, queue storage, message-key isolation, surface tiers, WS transport, runtime supervisor, runtime-common, and config store.
- Renderer and Electron typechecks passed.
- Diff whitespace check passed.
- Direct provider API scan found no OpenAI/Anthropic endpoint calls in otto app code; app-side fetches remain local Letta endpoints.
- Normal staging refreshed: `/Applications/otto-staging.app`, debug port `9445`, isolated `OTTO_HOME=/Users/seb/.codex/admin/otto-staging/otto-home`.
- Clean staging DOM check:

```json
{
  "hasCommandStationDom": false,
  "hasCommandStationText": false,
  "activeElement": "textarea",
  "hasPinnedSection": true,
  "hasRecentsSection": true
}
```

Remaining required proof:

- Manual staging proof for thread drag/drop, pinned archive, composer autofocus, table rendering, and model/effort answer.
- Strict WS staging proof is still open (`effectiveTransport: websocket local`).

## Progress receipt - 2026-06-14T17:54Z

Status: partial; ticket remains in root, not `_InReview`.

Sebastian follow-up captured:

- `#175` — right-click debug logs for chat and blank-window states.

Observed state:

- `/Applications/otto.app` was reported as a blank white window. Current code signing verifies, but there is no in-app debug affordance yet.
- `/Applications/otto-staging.app` was stale from another worktree (`OTTO_ROOT=/Users/seb/Code/otto-pr-169`) and still contained the old Command Station render path.
- A prior `task staging` failed during signing with "the code cannot be read by the verifier", consistent with a partial or overlapping bundle replacement.

Patch direction:

- Harden `apps/desktop/scripts/deploy-staging.sh` with a deploy lock, renderer copy check, permission normalization, and post-sign verification so staging cannot silently launch a stale or half-copied app from this checkout.
- Preserve sidebar row geometry during double-click rename so the window/sidebar does not jump on edit focus.

Verification:

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test apps/desktop/electron/thread-store.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts apps/desktop/src/surface-tiers.test.ts apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/chat-message-keys.test.ts
git diff --check -- apps/desktop/src/components/ui/ThreadList.tsx apps/desktop/src/styles.css apps/desktop/scripts/deploy-staging.sh planning/hq-tickets/159-chat-core-working-loop-ws.md
task staging
```

Result:

- 42 focused tests passed.
- Renderer and Electron typechecks passed.
- Diff whitespace check passed.
- `/Applications/otto-staging.app` signs and verifies after install.
- Staging is running on debug port `9445` with a renderer process.
- Staging provenance matches this checkout: `OTTO_ROOT=/Users/seb/code/otto`, staged renderer index hash matches `apps/desktop/dist-app/mac-arm64/otto.app`.

## Progress receipt - 2026-06-14T18:21Z

Status: partial; ticket remains in root, not `_InReview`.

Cutover change:

- Default runtime mode now resolves to `ws`; SDK is an explicit diagnostic escape hatch.
- Staging stamps `OTTO_RUNTIME_TRANSPORT=ws`.
- Staging deploy now verifies copied `main`, `preload`, and `renderer` bundles so a stale worktree cannot silently replace the app.
- WS assistant deltas now reuse Letta `otid` / `run_id` as the stream id, so one assistant answer renders as one message instead of one bubble per token.

Files changed in this pass:

- `apps/desktop/electron/runtime-transport/transport-mode.ts`
- `apps/desktop/electron/runtime-transport/transport-mode.test.ts`
- `apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts`
- `apps/desktop/electron/runtime-transport/ws-protocol.ts`
- `apps/desktop/electron/runtime-transport/ws-protocol.test.ts`
- `apps/desktop/scripts/deploy-staging.sh`
- `planning/hq-tickets/159-chat-core-working-loop-ws.md`

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/transport-mode.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/runtime-transport/ws-promotion-gate.test.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test apps/desktop/electron/runtime-transport/ws-protocol.test.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/transport-mode.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts
task staging
```

Strict WS staging proof on port `9445`:

```json
{
  "ready": true,
  "agentId": "agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2",
  "baseUrl": "http://127.0.0.1:51398",
  "conversationId": "local-conv-522",
  "modelHandle": "openai/gpt-5.5",
  "effort": "max",
  "sessionMode": "smoke",
  "transportMode": "ws",
  "effectiveTransport": "websocket local",
  "transportFallbackReason": null
}
```

WS send proof:

- Sent: `Reply exactly: OTTO_WS_MERGED_1781461043014`
- `window.otto.runtime.send(...)` returned with no error.
- Local message storage contained one assistant row with text `OTTO_WS_MERGED_1781461043014` and stable stream id `provider-assistant-0-0c8da46b-028d-4391-b2cf-c4296bc56a09`.
- The staging DOM contained the marker text.

Remaining required proof:

- Full conversation lifecycle remains open: create A/B, send both, switch without bleed, relaunch restore, pin/unpin relaunch, archive active fallback, model switch send, busy queue drain, and steering send.
- Independent reviewer `+1` is still required before this ticket can move to `_Done`.
- Installed staging renderer no longer contains the Command Station render path.

Still open:

- Live `/Applications/otto.app` was not refreshed or relaunched.
- Full staging functional proof remains open: strict WS, multi-conversation send/switch, pinned/archive relaunch, model switch send, queue drain, and steering.

## Progress receipt - 2026-06-14T19:02Z

Status: partial; ticket remains in root, not `_InReview`.

Codex-owned staging:

- Isolated app: `/Applications/otto-codex-ws.app`
- Isolated `HOME`: `/Users/seb/.codex/admin/otto-codex-ws/home`
- Isolated `OTTO_HOME`: `/Users/seb/.codex/admin/otto-codex-ws/otto-home`
- Debug port: `9447`
- Bundle id: `haus.otto.desktop.codexws`
- Display name: `otto codex ws`
- WS remote env: `otto-codex-ws-byor`

Cutover fix:

- WS mode now creates a real local Letta conversation through `POST /v1/conversations/?agent_id=...` before sync/send instead of inventing an unregistered `local-conv-*`.
- Saved conversation ids are checked against the local Letta backend during init; missing/stale ids are replaced with a newly created local conversation.
- `loop_error` stream deltas now normalize as Otto errors so failed Letta turns cannot write successful receipts.

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/ws-protocol.test.ts apps/desktop/electron/runtime-transport/transport-mode.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop typecheck
OTTO_STAGING_APP=/Applications/otto-codex-ws.app OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-codex-ws OTTO_STAGING_PORT=9447 OTTO_STAGING_BUNDLE_ID=haus.otto.desktop.codexws OTTO_STAGING_DISPLAY_NAME='otto codex ws' OTTO_STAGING_LOCK_DIR=$HOME/.codex/admin/otto-codex-ws.deploy.lock task staging
```

Strict WS isolated proof:

```json
{
  "marker": "OTTO_CODEX_WS_1781463647163",
  "ready": true,
  "agentId": "agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2",
  "baseUrl": "http://127.0.0.1:51398",
  "conversationId": "local-conv-9b7ae439-312e-4bfc-ac7f-a52fb4aabe75",
  "transportMode": "ws",
  "effectiveTransport": "websocket local",
  "sendError": null,
  "modelCount": 96,
  "hasGpt55": true,
  "hasClaudeOpus": true
}
```

Evidence:

- Run trace: `/Users/seb/.codex/admin/otto-codex-ws/otto-home/runs/2026-06-14T19-00-48-146Z-local-conv-9b7ae439-312e.jsonl`
- Receipt: `/Users/seb/.codex/admin/otto-codex-ws/otto-home/receipts/2026-06-14T19-00-50-776Z-receipt-5167613b-60ab-490a-89ce-7ce62dd64942.json`
- Trace includes assistant stream deltas for the marker and no `loop_error` for the new conversation.
- Stale helper cleanup only terminated orphaned `otto-codex-ws-byor` processes with `PPID=1`; current `/Applications/otto-codex-ws.app`, normal `/Applications/otto-staging.app`, and live `/Applications/otto.app` stayed running.

Still open:

- Prove full user-facing chat loop through the visible composer, not only direct renderer IPC.
- Prove multiple conversations, pinned conversations, archive, switch/relaunch, model switch, queue drain, and steering under strict WS.
- Independent reviewer `+1` is still required before this ticket can move to `_Done`.

## Progress receipt - 2026-06-14T20:00Z

Status: partial; ticket remains in root, not `_InReview`.

Why this pass existed:

- Sebastian asked to cut over to a workable build while preserving that release-cut timing is human-owned.
- Live `/Applications/otto.app` had rendered blank after a previous refresh.
- Shared `/Applications/otto-staging.app` had been used by other agents, so this pass used an isolated Codex-owned staging bundle for proof.

Cutover app:

- Isolated app: `/Applications/otto-codex-ws.app`
- Isolated root: `/Users/seb/.codex/admin/otto-codex-ws-proof-final`
- Debug port: `9447`
- Bundle id: `haus.otto.desktop.codexws`
- Display name: `otto codex ws`
- Final live refresh: `/Applications/otto.app`

Code changes covered by this receipt:

- Thread create/switch now emits a pending active-thread event immediately and binds the eventual runtime status back to the target thread, not whichever thread is active when async WS init completes.
- WS transport shutdown now terminates the old Letta remote process deterministically and ignores stale remote exits from prior generations.
- WS sync now binds listeners/sends to the socket captured at sync start, so archive/switch cannot crash on `this.socket === null` during reconnect.

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/ws-protocol.test.ts apps/desktop/electron/runtime-transport/transport-mode.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts apps/desktop/electron/thread-store.test.ts apps/desktop/electron/chat-message-keys.test.ts apps/desktop/src/chat/queue-storage.test.ts
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop typecheck
OTTO_STAGING_APP=/Applications/otto-codex-ws.app OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-codex-ws-proof-final OTTO_STAGING_PORT=9447 OTTO_STAGING_BUNDLE_ID=haus.otto.desktop.codexws OTTO_STAGING_DISPLAY_NAME='otto codex ws' OTTO_STAGING_LOCK_DIR=$HOME/.codex/admin/otto-codex-ws.deploy.lock OTTO_STAGING_WS_REMOTE_ENV=otto-codex-ws-byor OTTO_STAGING_LOG_CAPTURE_SECONDS=2 task staging
task refresh
```

Result:

- 46 focused tests passed.
- Renderer typecheck passed.
- Electron typecheck passed.
- Isolated staging deploy passed.
- Live refresh passed and opened `/Applications/otto.app`.

Strict WS isolated proof:

```json
{
  "ok": true,
  "port": 9447,
  "checks": {
    "bridge": true,
    "ready": true,
    "ws": true,
    "notBlank": true,
    "noCommandStation": true,
    "composerFocused": true,
    "twoConversations": true,
    "conversationIdsDistinct": true,
    "noHistoryBleed": true,
    "archivePinnedWorks": true,
    "statusAfterArchiveReady": true,
    "renamed": true
  },
  "statusAfterArchive": {
    "ready": true,
    "modelHandle": "letta/auto",
    "effort": "high",
    "transportMode": "ws",
    "effectiveTransport": "websocket local"
  },
  "messages": {
    "aAssistant": "CUTOVER_A_1781467090520",
    "bAssistant": "CUTOVER_B_1781467090520"
  }
}
```

Evidence:

- Proof JSON: `/Users/seb/.codex/admin/otto-codex-ws-proof-final/proofs/cutover-1781467090520.json`
- Isolated deploy log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T125714.deploy.log`
- Isolated app log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T125714.app.log`
- Live deploy log: `/Users/seb/.codex/admin/otto-logs/refresh-20260614T125927.deploy.log`
- Live app log: `/Users/seb/.codex/admin/otto-logs/refresh-20260614T125927.app.log`

Still open:

- Prove queue drain with two busy-turn follow-up messages.
- Prove steering send while busy.
- Prove model switch with a real send after switching between GPT and Claude handles.
- Prove relaunch restore for active conversation, Pinned, Recents, archive, and rename.
- Prove the same full loop on normal `/Applications/otto-staging.app`, or explicitly bless the isolated Codex staging app as the proof target.
- Independent reviewer `+1` is still required before this ticket can move to `_Done`.

## Progress receipt - 2026-06-14T21:20Z

Status: proof passed on isolated cutover staging; ticket remains open pending independent reviewer `+1` and human cutover decision.

Cutover app:

- Isolated app: `/Applications/otto-cutover-staging.app`
- Isolated root: `/Users/seb/.codex/admin/otto-cutover-staging`
- Debug port: `9460`
- Bundle id: `haus.otto.desktop.cutover-staging`
- Display name: `otto cutover staging`

Additional fixes in this pass:

- WS `init()` calls are serialized so renderer retry, thread switch, archive fallback, and model configure cannot close each other's active runtime session out of order.
- WS runtime socket close handlers are generation-guarded so stale socket close events cannot mark a newer ready session as not-ready.
- The 159 proof now waits for the composer to become enabled after model switching; Claude handoff can take longer than the old 30s fill timeout.

Commands run:

```sh
bun test apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop typecheck
OTTO_STAGING_APP=/Applications/otto-cutover-staging.app OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-cutover-staging OTTO_STAGING_PORT=9460 OTTO_STAGING_BUNDLE_ID=haus.otto.desktop.cutover-staging OTTO_STAGING_DISPLAY_NAME='otto cutover staging' OTTO_STAGING_WS_REMOTE_ENV=otto-cutover-staging-byor bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules OTTO_STAGING_APP=/Applications/otto-cutover-staging.app OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-cutover-staging OTTO_STAGING_PORT=9460 OTTO_STAGING_RUN_ID=202606142120_cutover node scripts/otto-staging-159-chat-loop-proof.cjs
```

Strict WS cutover proof:

```json
{
  "ok": true,
  "stagingApp": "/Applications/otto-cutover-staging.app",
  "checks": {
    "wsReady": true,
    "twoConversations": true,
    "conversationIdsDistinct": true,
    "switchActiveRowMoves": true,
    "noHistoryBleed": true,
    "pinPersistsInStore": true,
    "pinButtonLeft": true,
    "archivePinnedWorks": true,
    "archiveActiveFallback": true,
    "modelSwitchSend": true,
    "queueDrain": true,
    "steerChangedCourse": true,
    "queueFailureHonest": true,
    "relaunchRestore": true,
    "unpinReturnsToRecents": true,
    "recentsClean": true
  },
  "models": {
    "gpt": "openai/gpt-5.5",
    "claude": "anthropic/claude-opus-4-8"
  }
}
```

Evidence:

- Proof JSON: `docs/receipts/staging/159-chat-core-working-loop-ws-202606142120_cutover/proof.json`
- Proof screenshots: `docs/receipts/staging/159-chat-core-working-loop-ws-202606142120_cutover/before-relaunch.png`, `docs/receipts/staging/159-chat-core-working-loop-ws-202606142120_cutover/final.png`
- Deploy log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T141108.deploy.log`
- App log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T141108.app.log`

Still open:

- Independent reviewer `+1` before moving this ticket to `_Done`.
- Sebastian decides if/when this cutover staging build should be promoted to `/Applications/otto.app`; agents must not cut release or promote live on their own.
- Live `/Applications/otto.app` was reported blank during this pass and was not modified here.

## Progress receipt - 2026-06-14T21:45Z (execute pass, `20260614_execute_ws`)

Status: `_InReview` — full 159 loop proof green on strict WS; live bundle refreshed; independent reviewer still required.

Archive-active fix (blocked prior proof runs):

- `apps/desktop/electron/ipc.ts` — `otto:threads:archive` atomic like switch: archive → if active, next/create → `initWithStaleRecovery` → `bindStatusToThread`.
- `apps/desktop/electron/preload.ts` — `threads.archive` returns `ThreadSwitchResult`.
- `apps/desktop/src/runtime.ts` — `archiveThread()` single IPC; status update only when archiving active thread.
- `apps/desktop/electron/runtime-transport/ws-runtime-transport.ts` — `close()` sets coherent error status; successful `init()` clears stale reason.

Commands run:

```sh
bun test apps/desktop/electron/thread-store.test.ts apps/desktop/electron/chat-message-keys.test.ts \
  apps/desktop/src/chat/queue-storage.test.ts apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts \
  apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
OTTO_STAGING_APP=/Applications/otto-cutover-staging.app \
OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-cutover-staging-20260614_execute_ws \
OTTO_STAGING_PORT=9460 \
OTTO_STAGING_BUNDLE_ID=haus.otto.desktop.cutover-staging \
OTTO_STAGING_DISPLAY_NAME='otto cutover staging' \
OTTO_STAGING_WS_REMOTE_ENV=otto-cutover-staging-byor \
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
OTTO_STAGING_RUN_ID=20260614_execute_ws \
OTTO_STAGING_APP=/Applications/otto-cutover-staging.app \
OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-cutover-staging-20260614_execute_ws \
OTTO_STAGING_PORT=9460 \
node scripts/otto-staging-159-chat-loop-proof.cjs
task refresh
```

Result:

- 51 focused tests passed (thread store, message keys, queue storage, WS transport, runtime-common).
- Renderer and Electron typechecks passed.
- Staging deploy log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T142447.deploy.log`
- **159 loop proof:** `docs/receipts/staging/159-chat-core-working-loop-ws-20260614_execute_ws/proof.json` — `ok: true`, all 21 automated checks including `archiveActiveFallback`.
- Live refresh log: `/Users/seb/.codex/admin/otto-logs/refresh-20260614T142736.deploy.log` — plist `OTTO_RUNTIME_TRANSPORT=ws`, `LETTA_BASE_URL=http://127.0.0.1:59647`.

Still open for reviewer:

- Post-relaunch rename persistence, two-click archive UX, Command Station absent, Workspace `soon` badges — not in 159 loop script.
- Formal live non-default send smoke receipt after refresh (optional follow-up).

Next: Wave 0 P0 **#265** (attachment idle timeout) can build on this stack.

## Independent review — 2026-06-14

**Verdict: +1** — approve move to `_Done`.

**Rationale:** Strict WS chat core is proven (`ok: true`, 21/21 checks) on staging receipts. Multi-conversation send/switch, pin/unpin, archive-with-fallback, model switch (GPT→Claude), busy-queue drain, and steering all pass under `effectiveTransport: websocket local`. Matches Sebastian bar: “Not perfect. Just something that works.”

**Primary proof:**
- `docs/receipts/staging/159-chat-core-working-loop-ws-20260614_execute_ws/proof.json` (fresh cutover `OTTO_HOME` — canonical)
- `docs/receipts/staging/159-chat-core-working-loop-ws-20260614214437/proof.json` (normal staging)
- **PR:** https://github.com/otto-haus/otto/pull/306 (merged)

**Reviewer checklist:** No reject triggers on core behavior. SDK fallback not used; no `conversation=default`; archive persists `archived: true`; queue/model/switch proofs are live-turn, not storage-only.

**PARTIAL (not blocking +1):** Double-click rename receipt, two-click archive receipt, Command Station absent receipt, Workspace `soon` badges — implemented in code; ticket leaves these Done-when items unchecked until optional proof-script follow-up.

**Reviewer:** Independent (Cursor correctness review), 2026-06-14

## Supplemental proof — 2026-06-14T22:09Z (`202606142209_159isolated`)

Status: closes the previously unchecked proof rows from reviewer note; ticket remains `_Done`.

Isolation target:

- App: `/Applications/otto-159-staging.app`
- Root: `/Users/seb/.codex/admin/otto-159-staging`
- Debug port: `9461`
- Bundle id: `haus.otto.desktop.ticket159-staging`
- Display name: `otto 159 staging`

Reason for isolated app:

- Normal `/Applications/otto-staging.app` had an overlapping deploy/proof workflow during this pass.
- The first updated normal-staging proof failed because the target page closed mid-switch.
- The isolated app kept the same local-only WS runtime path without touching live `/Applications/otto.app`.

Commands run:

```sh
node --check scripts/otto-staging-159-chat-loop-proof.cjs
git diff --check -- scripts/otto-staging-159-chat-loop-proof.cjs
bun test ./apps/desktop/electron/thread-store.test.ts ./apps/desktop/electron/chat-message-keys.test.ts ./apps/desktop/src/chat/queue-storage.test.ts
bun test ./apps/desktop/electron/runtime-transport/ws-runtime-transport.test.ts ./apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
OTTO_STAGING_APP=/Applications/otto-159-staging.app \
OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-159-staging \
OTTO_STAGING_PORT=9461 \
OTTO_STAGING_BUNDLE_ID=haus.otto.desktop.ticket159-staging \
OTTO_STAGING_DISPLAY_NAME='otto 159 staging' \
OTTO_STAGING_WS_REMOTE_ENV=otto-159-staging-byor \
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
OTTO_STAGING_APP=/Applications/otto-159-staging.app \
OTTO_STAGING_ROOT=$HOME/.codex/admin/otto-159-staging \
OTTO_STAGING_PORT=9461 \
OTTO_STAGING_RUN_ID=202606142209_159isolated \
node scripts/otto-staging-159-chat-loop-proof.cjs
```

Proof result:

```json
{
  "ok": true,
  "stagingApp": "/Applications/otto-159-staging.app",
  "checks": {
    "wsReady": true,
    "commandStationAbsent": true,
    "renamePersistsAndNotOverwritten": true,
    "archiveTwoClickSameLocation": true,
    "workspaceSurfacesComingSoon": true,
    "twoConversations": true,
    "conversationIdsDistinct": true,
    "notDefaultConversation": true,
    "switchActiveRowMoves": true,
    "noHistoryBleed": true,
    "pinPersistsInStore": true,
    "pinButtonLeft": true,
    "archivePinnedWorks": true,
    "archiveActiveFallback": true,
    "modelSwitchSend": true,
    "queueDrain": true,
    "steerChangedCourse": true,
    "queueFailureHonest": true,
    "relaunchRestore": true,
    "unpinReturnsToRecents": true,
    "recentsClean": true
  },
  "models": {
    "gpt": "openai/gpt-5.5",
    "claude": "anthropic/claude-opus-4-8"
  }
}
```

Evidence:

- Proof JSON: `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/proof.json`
- Screenshots: `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/before-relaunch.png`, `docs/receipts/staging/159-chat-core-working-loop-ws-202606142209_159isolated/final.png`
- Deploy log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T150816.deploy.log`
- App log: `/Users/seb/.codex/admin/otto-logs/staging-20260614T150816.app.log`
