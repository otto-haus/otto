# 128 — Memory Writeback Gate UI

Owner: Codex
Priority: P1
Depends on: 048, 016, 047, 122
Release bucket: category wedge — culture compounding

## Outcome

**Memory writeback** is never silent. Every Letta memory change proposed through otto passes an explicit **writeback gate** in UI: classification, reversibility, constitution check (**122**), Curation accept — then receipt.

Letta applies memory; otto governs **whether and how** writeback is proposed and ratified.

## Why this matters (category)

Letta owns memory. Otto owns **culture over memory** — the highest-risk blur if writeback bypasses Curation.

**047** is read-only observatory. **048** includes memory as proposal target. **128** makes the gate **visible and enforced** in product UX.

## Scope

- Proposal flow when target = `memory` / `memory_writeback`:
  - Gate panel: what will be written (summary), source evidence, reversibility note
  - Constitution check: writeback_policy from **122** (block or warn + receipt)
  - Risk/autonomy class preview (**017**)
  - Explicit copy: “Memory changes only after you accept in Curation”
- Curation inbox: memory proposals visually distinct (icon/badge)
- Accept path: requires **126** ratification moment variant (“Behavior updated · memory writeback”)
- Reject/defer: no Letta write; receipt:blocked or receipt:deferred
- No direct “Edit memory” from otto UI (**047** non-goal preserved)

## Non-goals

- Letta block CRUD from otto
- Auto-writeback on chat end
- Bulk memory import

## Done when

- [ ] Staging: memory proposal shows gate panel; accept → receipt + ratification moment; reject → no write
- [ ] Constitution writeback_policy violation → blocked + receipt
- [ ] Unit test: proposal kind `memory_writeback` cannot skip Curation
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
# manual: propose memory writeback → gate → accept → receipt (Letta apply path documented in receipt)
```

## Blocker log

Leave blank unless blocked.
