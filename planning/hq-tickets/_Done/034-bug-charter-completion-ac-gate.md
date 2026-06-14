# 034 — Charters: gate complete status on AC proof

Owner: Codex
Priority: P1
Depends on: none
Release bucket: v0.1

## Outcome

A charter cannot move to `complete` unless every acceptance criterion has at least one linked receipt.

## Why this matters

Ship check / surface contract: completion without proof enables fake done — violates otto north star.

## Scope

- `charter-store.ts`: reject `complete` when any AC has empty `receipts`
- `linkRunReceipt`: optional `acId` to populate AC-level receipt links
- UI: blocked complete with honest reason in Charters pane

## Out of scope

- Full plan/gates/ledger layout (separate craft ticket)

## Done when

- Attempting complete with empty AC receipts fails with clear error
- Successful complete requires AC receipt coverage
- Unit test in charter-store tests
- Verification recorded in ticket

## Verification

```sh
cd /Users/seb/Code/otto
bun --cwd apps/desktop test ./electron/*.test.ts
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.
