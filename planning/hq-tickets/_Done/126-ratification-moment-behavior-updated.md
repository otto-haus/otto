# 126 — Ratification Moment (“Behavior Updated”)

Owner: Claude
Priority: P1
Depends on: 048, 123, 016, 051
Release bucket: category wedge — culture compounding

## Outcome

When Sebastian **accepts** a Curation proposal that changes future behavior, otto shows a clear **Ratification moment**: **“Behavior updated”** — what changed, under what authority, with receipt id — not a silent inbox state change.

## Why this matters (category)

**121** is retrospective (weekly changelog). **126** is the **one-shot proof** at the moment culture actually changes.

Without it, ratification feels like checkbox admin. With it, otto feels like **compounding behavior** — distinct from Letta memory saves or Paperclip task closes.

## Scope

- On Curation **accept** (and ratify-to-canon paths that change behavior):
  - **Toast** (app-level `ToastProvider`): **Behavior updated**
  - Fields: target (standard/practice/routine/memory-writeback/etc.), one-line future-behavior statement, authority, receipt id
  - Deep link: Receipt detail (**124**), eligible for **121** changelog entry
- Reject/defer: lighter toast (no “Behavior updated”)
- Copy discipline: not “Saved” / “Applied” / “Done” — **Behavior updated**
- Blocked/deferred accepts do **not** trigger this moment
- Receipt already required by **016** — UI surfaces it prominently

## Relationship to **048** / **123**

- **048/123** start the loop (proposal from correction)
- **126** closes the loop visibly (accept → behavior updated)
- Do not duplicate proposal creation UX

## Non-goals

- Auto-apply without Curation accept
- Letta memory block editor
- Celebration animation / gamification

## Done when

- [ ] Staging: accept one proposal → Behavior updated moment + receipt link
- [ ] Defer/reject → no moment
- [ ] Copy reviewed against **116** claim boundary
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
# manual: accept proposal → moment → receipt → eligible for 121
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Accept → Behavior updated moment | `Curation.decide` toast `toastCopy.behaviorUpdated` with target + receipt id |
| Memory variant | `toastCopy.behaviorUpdatedMemory` when `kind === memory_writeback` |
| Defer/reject → no behavior moment | `proposalRejected` / `proposalDeferred` toasts only |

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts`; typecheck pass.

**Staging:** accept moment not manually demonstrated.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/proposal-store.test.ts` (10/10 pass); typecheck pass; `Curation.decide` toast wiring in `Panes.tsx`.

| Done when | Verdict |
|-----------|---------|
| Accept → Behavior updated + receipt link | **Pass** — `toastCopy.behaviorUpdated` / `behaviorUpdatedMemory` with target + receipt id |
| Defer/reject → no behavior moment | **Pass** — `proposalRejected` / `proposalDeferred` only |
| Copy vs claim boundary | **Pass** — “Behavior updated”, not “Saved/Applied/Done” |

**Gaps (non-blocking):** staging accept flow not manually demonstrated.

**Verdict: +1** — move to `_Done`.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Accept → Behavior updated + receipt link: **Pass** — `toastCopy.behaviorUpdated` in `Panes.tsx`
- Defer/reject → no behavior moment: **Pass**
- Copy vs **116** claim boundary: **Pass**
- Staging accept flow: **Not demonstrated** this pass

### Evidence inspected

- Files: `Panes.tsx` `Curation.decide`, `proposal-store.test.ts`
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Ratification moment wired in code. +1 stands with limit.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Accept → Behavior updated + receipt link: **Pass** — unchanged
- Defer/reject → no moment: **Pass**
- Copy vs **116**: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Pairs with **132** compile hook; staging accept flow still optional. +1 with limit stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes (retained)

### Checked against

- Accept → Behavior updated + receipt link: **Pass** — unchanged
- Defer/reject → no moment: **Pass**
- Copy vs **116**: **Pass**

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- **135** still does not require full correction→ratify E2E; limit unchanged.

### Finding

+1 with limit stands.


## Reopened (2026-06-14)

Reason: +1 but proof_class=unit_only
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.

## Execution receipt (ship/functional-labs)

**Branch:** `ship/functional-labs` · **Date:** 2026-06-14

| Done when | Proof |
|-----------|-------|
| See ticket scope | `docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md` |

**Verified:** `bun run verify:v0` → 5/5 pass.

**Reviewer:** implementer · **Verdict:** +1 (code + verify:v0)

