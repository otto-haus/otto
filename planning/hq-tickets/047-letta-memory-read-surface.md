# 047 — Letta Memory Observatory (Read-Only)

Owner: Cursor
Priority: P1
Depends on: 001, 002, **076**
Release bucket: v0.1 workspace

## Outcome

Desktop exposes a **read-only Memory Observatory** — blocks, search, recent writes — without porting Letta’s full memory UI or claiming otto owns memory.

## Why this matters

Knowledge ≠ Memory. Operators need to inspect what Letta remembers separately from Knowledge files and Cognee (040–044). Chat rejected full Letta memory graph port; this is the thin otto-native slice.

## Scope

- IPC: fetch Letta memory blocks / summary (read-only API against embedded or advanced agent)
- Surface or Settings subsection: list blocks, search, last updated, recent write indicators
- **Open in Letta** link for deep edits (external) — no inline block editor in otto v1
- Chat subtitle “Letta memory on/off” links here
- Honest empty/error when agent disconnected
- No write path from otto UI — writeback only via Curation `memory` proposals

## Non-goals

- Full Letta memory graph / editor clone
- Memory writeback from this surface
- Cognee graph UI (044)
- otto as memory system of record

## Done when

- [ ] Connected staging agent: ≥1 memory block visible with metadata
- [ ] Search/filter works on real data
- [ ] Disconnected: honest blocker empty state
- [ ] No mock memory rows
- [ ] Receipt documents API surface used
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun test ./apps/desktop/electron/*.test.ts
bash apps/desktop/scripts/deploy-staging.sh
```

## Related

- **076** — stable embedded agent required for default path
- **078** — provider auth separate from memory read

## Blocker log

Leave blank unless blocked.
