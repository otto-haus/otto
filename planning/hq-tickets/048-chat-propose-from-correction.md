# 048 — Chat: Propose from Correction

Owner: Cursor
Priority: P0
Depends on: 014, 016, 002
Release bucket: v0.1 behavior loop

## Outcome

From Chat, Sebastian can turn a correction into a **Curation proposal** without opening the Curation pane first — closing the magic-moment loop step 1.

```txt
mistake → correction → proposal → ratify → changed behavior
```

## Why this matters

IPC `create-from-correction` exists; Chat UI does not. One-pager V1 test "correction → compounds" stays Partial until this ships.

## Scope

- Message action: "Propose from correction" on user message or assistant mistake context
- Target picker: memory / practice / routine / standard / knowledge / task
- Calls existing proposal store; shows proposal id + link to Curation
- Classification preview (route ask vs auto_apply note)
- Receipt for proposal creation

## Out of scope

- Auto-accept
- Inline ratification (use Curation pane)
- Discord propose path (020)

## Done when

- Staging: one correction creates proposal visible in Curation inbox
- Proposal includes future-behavior statement + evidence refs
- Canon unchanged until accept
- Unit test for IPC handler path

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
