# 025 — Pinned Chat List

Owner: Claude
Priority: P2
Depends on: 002, 003
Release bucket: later-generated

## Outcome

Otto can show multiple chats in a sane order without turning the sidebar into clutter.

## Scope

- Chat records have `pinned`, `archived`, and `updatedAt` fields.
- Sidebar/chat picker groups pinned chats first.
- Unpinned active chats sort by `updatedAt` descending.
- Archived chats are hidden by default.

## Done when

- Pinned chats stay at top.
- Active unpinned chats appear newest-first.
- Archived chats do not appear in the default list.
- User can still access archived chats from an explicit archive view/filter.
- Current single-chat v1 flow still works.
