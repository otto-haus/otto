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
