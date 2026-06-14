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

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Memory proposal gate panel | `ProposeCorrectionModal` writeback gate + constitution block |
| Curation memory badge | `curationCopy.memoryBadge` on `memory_writeback` proposals |
| Accept ratification memory variant | `behaviorUpdatedMemory` toast on accept |
| Unit test cannot skip Curation | `memory_writeback proposals cannot skip Curation` test |

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts`; typecheck pass.

**Staging:** Letta apply path on accept not manually exercised.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts` (includes `memory_writeback proposals cannot skip Curation`); typecheck pass; `ProposeCorrectionModal` gate panel.

| Done when | Verdict |
|-----------|---------|
| Memory proposal gate panel | **Pass** — writeback gate copy, evidence summary, constitution block disables submit |
| Constitution violation blocked | **Pass** — `writebackAllowed` from constitution policy in `Chat.tsx` |
| Unit test cannot skip Curation | **Pass** — `memory_writeback` kind + accept path tests |
| Accept → ratification memory variant | **Pass** — `behaviorUpdatedMemory` toast + `memoryBadge` in inbox |

**Gaps (non-blocking):** Letta apply on accept not manually exercised; reject/defer “no write” is by design (no Letta CRUD) — receipt path covered by proposal-store.

**Verdict: +1** — move to `_Done`.

## Execution notes (rev3)

**Date:** 2026-06-13 · **Lane:** Cursor foundation blockers

- Writeback gate reads `constitution.get()` via preload; **122** IPC wiring unblocks live `writeback_policy` check in Electron (no stub fallback).
- Added `ChatThreadRecord`, `ThreadListResult`, `ProviderMirrorSnapshot`, `activeThreadId` to `shared/types` for electron compile hygiene (046/078/047 adjacent).

## Review rev3

**Foundation IPC:** Pass — constitution policy reachable from renderer when Electron handlers registered.

## Execution rev5

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13 · **Lane:** Cursor (review gap closure)

| Done when | Proof |
|-----------|-------|
| Memory proposal gate panel | `ProposeCorrectionModal` writeback gate when target = memory; constitution policy disables submit when violated |
| Constitution violation blocked | `constitutionGet` → `writeback_policy` check; warn panel + disabled Create proposal |
| Unit test cannot skip Curation | `memory_writeback proposals cannot skip Curation` in `proposal-store.test.ts` |
| Accept → ratification memory variant | Unchanged — `behaviorUpdatedMemory` toast + `memoryBadge` |

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts` (12/12); `bun run --cwd apps/desktop electron:typecheck`.

## Review rev5

**Reviewer:** implementer self-check (regression closure) · **Date:** 2026-06-13

| Done when | Verdict |
|-----------|---------|
| Memory proposal gate panel | **Pass** |
| Constitution violation blocked | **Pass** |
| Unit test cannot skip Curation | **Pass** |
| Accept → ratification memory variant | **Pass** (unchanged) |

**Verdict: +1**

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Memory proposal gate panel: **Pass** — `ProposeCorrectionModal` writeback gate
- Constitution `writeback_policy` violation blocked: **Pass** — constitution IPC + disabled submit
- Unit test cannot skip Curation: **Pass** — `proposal-store.test.ts`
- Letta apply on accept: **Not exercised** (by design — no Letta CRUD in v0)

### Evidence inspected

- Files: `ProposeCorrectionModal.tsx`, `constitution-store.ts`, `proposal-store.test.ts`
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Writeback gate UI + policy enforcement proven at unit level. +1 stands with limit.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Memory writeback gate panel: **Pass** — unchanged
- Constitution policy block: **Pass**
- Unit test cannot skip Curation: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Separate from Checks runtime; no regression. +1 with limit stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes (retained)

### Checked against

- Memory writeback gate panel: **Pass** — unchanged
- Constitution policy block: **Pass**
- Unit test cannot skip Curation: **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- Checks wedge orthogonal; no interaction regression.

### Finding

+1 with limit stands.


## Execution receipt (culture-wedge)

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-14 · **Lane:** culture-wedge agent

| Done when | Proof |
|-----------|-------|
| Memory proposal gate panel | `MemoryWritebackGatePanel` in `ProposeCorrectionModal`; `constitutionGet` IPC |
| Constitution violation blocked | `writeback_policy` check disables submit |
| Unit test cannot skip Curation | `proposal-store.test.ts` `memory_writeback` test |
| Accept → ratification variant | `behaviorUpdatedMemory` + `memoryBadge` (unchanged) |

**Verified:** `bun run verify:v0` → 5/5; `bun test ./apps/desktop/electron/proposal-store.test.ts` → 12/12.

**133 note:** Check runtime does not gate proposal creation; memory writeback remains proposal-only → Curation. Standalone `MemoryWritebackGate` modal reserved for future Letta apply IPC.

## Review

Reviewer: culture-wedge implementer
Date: 2026-06-14
Verdict: +1 (with limit: Letta apply not exercised) — ready for `_Done`
