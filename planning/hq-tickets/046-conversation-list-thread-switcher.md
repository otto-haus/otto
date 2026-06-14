# 046 — Chat: Multi-Thread Conversations (List + Switcher)

Owner: Claude
Priority: P0
Depends on: 002, 003
Release bucket: v0.1 workspace

Label: **Ship blocker** — operator-visible gap (2026-06-14 audit)

## Outcome

Otto supports **multiple Letta conversations** with a visible thread list and switcher. Operators can create a new thread, return to an old one, and see isolated message history per thread — not a single immortal session with no list.

Supersedes parked **025** (pinned chat list). Incorporate `pinned`, `archived`, `updatedAt` from 025 when storage lands.

## Why this matters (audit 2026-06-14)

Screenshot/staging shows:

- Sidebar has **"+ New chat"** but **no thread list** beneath it — only a lone "Chat" nav item.
- Operator perception: *"there's no way to make more than one thread"* even when runtime is connected.
- Onboarding dock says "Go to Chat" while already on Chat — separate onboarding bug (073).

**Current behavior (broken for multi-thread):**

| Piece | Today |
|--------|--------|
| `Sidebar.tsx` | No `sidebar__threads` rendered (CSS exists but unused) |
| `newChat()` | Clears `conversationId` + wipes `otto.chat.messages.v1` — previous thread **lost from UI** |
| `config-store` | Stores **one** `lastSession.conversationId` per server |
| Letta runner | Single active conversation; no list/resume-by-id API exposed to renderer |

"New chat" is a **reset**, not **create thread N+1**.

## Architecture target

### 1. Thread index (local + Letta ids)

Persist under `~/.otto/threads/` or config slice:

```yaml
id: local_<uuid>
lettaConversationId: <id | null until first send>
agentId: <agent>
title: <first message snippet | "New chat">
updatedAt: <iso>
pinned: false
archived: false
```

Active thread id in config; messages keyed per thread:

```txt
otto.chat.messages.v1 → otto.chat.messages.<threadId>.v1
```

### 2. Sidebar UX (wire dormant styles)

Use existing classes in `styles.css`: `sidebar__threads`, `threadGroup`, `thread`, `threadGroup__label`.

```txt
[+ New chat]
─────────────
Recent          ← threadGroup
  ● Thread title …
  ○ Older thread …
─────────────
Chat            ← nav item stays; selecting Chat shows active thread
…
```

- **New chat** → create index row + switch; call runner to start fresh Letta conversation (or lazy-create on first send).
- **Click thread** → load that thread's messages + resume Letta `conversationId` if set.
- **Pinned first**, then `updatedAt` desc.
- **Archived** hidden unless "Show archived" toggled.

### 3. Electron / runner

- `otto:threads.list` | `create` | `switch` | `archive` | `pin`
- `switchThread(threadId)` → update config, re-init or attach session with stored `conversationId`
- `newChat()` becomes `createThread()` or alias; must **not** destroy other threads' stored messages
- List conversations from Letta API where available; merge with local index (Letta id is source of truth for resume)

### 4. Honest states

- Disconnected: thread list may show local titles but switch/send blocked with reason
- Empty thread list + connected: only "New chat" until first thread created
- **No mock threads**

## Scope

- Thread index persistence + IPC
- Sidebar thread list wired to styles
- Per-thread message storage in renderer
- Runner resume by `conversationId`
- Chat header optional subtitle: active thread title
- Keyboard: ⌘N new thread (existing), ⌘1..9 switch recent (optional stretch)

## Out of scope

- Full Letta memory browser (047)
- Cloud thread sync
- Discord thread mirroring (020)
- Renaming threads via LLM (manual title from first message is enough v1)

## Done when

- [ ] Create **two** threads; send message in each; switch back — messages **isolated** and correct
- [ ] Sidebar shows **≥2** thread rows with distinct titles
- [ ] Reload app — thread list and active thread restore
- [ ] "New chat" adds a thread; does **not** erase prior threads from index or storage
- [ ] Archived thread hidden until archive view opened
- [ ] Disconnected: honest empty/blocker; no fake list
- [ ] Staging smoke + screenshots (before/after sidebar)
- [ ] Disposable conversations only in smoke — never `conversation=default`
- [ ] Reviewer +1

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test ./apps/desktop/electron/*.test.ts
bash apps/desktop/scripts/deploy-staging.sh
# manual: two threads, switch, relaunch
```

## Related

- Parked **025** — superseded by this ticket
- **073** — onboarding dock on Chat when already on Chat
- **049** — chat orchestration commands (depends on stable thread model)

## Blocker log

Leave blank unless blocked.
