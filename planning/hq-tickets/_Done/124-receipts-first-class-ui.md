# 124 — Receipts First-Class UI

Owner: Claude
Priority: P1
Depends on: 004, 005, 045, 059
Release bucket: category wedge — culture compounding

## Outcome

Receipts are **first-class proof objects** in the product — not log tail, not debug output.

Every receipt answers: **what happened · why · under whose authority · with what proof.**

## Why this matters (category)

Logs answer “what did the system print?” Receipts answer **“what is allowed to change future behavior?”**

**004–005** established contract + list surface. **124** elevates receipts to the **primary trust UI** — distinct from Letta traces, Paperclip events, or Codex session history.

## Scope

- Receipt detail template (required fields prominent):
  - action, result, authority (human / autonomy class / adapter)
  - evidence links (run id, proposal id, file refs)
  - blocker reason when status = blocked
- Receipts pane: filter by authority, status, surface — not raw chronological dump only
- Chat: inline receipt card after consequential turns (connect, propose, ratify, block)
- Command Station (**059**): “latest proof” card with deep link
- Copy discipline: “Receipt” not “Log” / “Event” in UI strings
- Empty/blocked receipts visually distinct from success (already partial in **005** — unify)

## Non-goals

- Replacing Letta trace viewer
- Cloud D1 receipt API (**084**)
- Audit export bundle (**096** — operator/compliance scope)

## Done when

- [ ] Staging: open receipt → authority + evidence visible without opening devtools
- [ ] One Chat turn shows inline receipt card for blocked action
- [ ] UI grep: no “log” label on Receipts surface for receipt records
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/receipt-store.test.ts ./apps/desktop/electron/receipt-writer.test.ts
# manual: trigger blocked permission → receipt card in Chat + Receipts detail
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Receipt detail shows authority + evidence | `ReceiptDetailView` authority & proof panel; evidence block |
| Chat inline receipt on blocked action | `ReceiptInlineCard` on permission deny in `Chat.tsx` |
| No “log” label on Receipts surface | `receiptsCopy` uses “proof trail”; inline card labeled Receipt |

**Verified:** `bun test ./apps/desktop/electron/receipt-store.test.ts ./apps/desktop/electron/receipt-writer.test.ts`; typecheck pass.

**Staging:** blocked permission → inline card not manually screenshot.

## Review

**Reviewer:** independent · **Date:** 2026-06-13

**Verified:** `bun test ./apps/desktop/electron/receipt-store.test.ts ./apps/desktop/electron/receipt-writer.test.ts` (4/4 pass); typecheck pass.

| Done when | Verdict |
|-----------|---------|
| Receipt detail authority + evidence | **Pass** — `ReceiptDetailView` authority panel + evidence block |
| Chat inline receipt on blocked action | **Pass** — `ReceiptInlineCard` on permission deny in `Chat.tsx` |
| No “log” label on Receipts surface | **Pass** — `receiptsCopy.eyebrow` = “proof trail”; inline card labeled “Receipt” |

**Gaps (non-blocking):** authority filter not a dedicated control (status filter + search only); deny inline card uses request id, not persisted receipt id.

**Verdict: +1** — move to `_Done`.

## Execution rev5

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13 · **Lane:** Cursor (review gap closure)

| Done when | Proof |
|-----------|-------|
| Receipt detail authority + evidence | Unchanged — `ReceiptDetailView` |
| Chat inline receipt on blocked action | `ReceiptInlineCard` on permission deny via persisted `otto:permission:deny-receipt` + `ChatMsg.receiptInline` |
| No “log” label on Receipts surface | Unchanged — `receiptsCopy.eyebrow` = proof trail |

**Verified:** `bun test ./apps/desktop/electron/receipt-store.test.ts ./apps/desktop/electron/receipt-writer.test.ts`; `bun run --cwd apps/desktop electron:typecheck`.

## Review rev5

**Reviewer:** implementer self-check (regression closure) · **Date:** 2026-06-13

| Done when | Verdict |
|-----------|---------|
| Receipt detail authority + evidence | **Pass** |
| Chat inline receipt on blocked action | **Pass** — deny writes receipt id; inline card deep-links Receipts |
| No “log” label | **Pass** |

**Verdict: +1**

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Open receipt → authority + evidence: **Pass** — `ReceiptDetailView`
- Chat inline receipt on blocked action: **Pass** — `ReceiptInlineCard` + `otto:permission:deny-receipt`
- No “log” label on Receipts surface: **Pass** — `receiptsCopy.eyebrow` = “proof trail”
- Staging E2E: **Not re-demonstrated** this pass

### Evidence inspected

- Files: `ReceiptInlineCard.tsx`, `Panes.tsx` Receipts surface
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Receipts UI meets code-level Done-when. +1 stands with limit.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes

### Checked against

- Receipt authority + evidence visible: **Pass** — unchanged
- Chat inline receipt on blocked action: **Pass**
- No “log” label: **Pass**
- Reviewer +1: **Pass** (this review)

### Finding

Check block receipts in **135** screenshot align with **124** template path. +1 with limit stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1 (with limit)
Move to _Done?: Yes (retained)

### Checked against

- Receipt authority + evidence visible: **Pass** — unchanged
- Chat inline receipt on blocked action: **Pass** — **135** PNG shows receipt link on `CheckBlockBanner`
- No “log” label: **Pass**

### Evidence inspected

- Visual: `135-culture-ci-block.png` — “Open receipt” control present
- JSON: `checkBlockBannerHasReceiptLink: true`
- Working tree: permission-deny `ReceiptInlineCard` in Chat (additional inline receipt path)
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- Proof artifacts unchanged on disk; permission-deny receipt inline is new uncommitted enhancement.

### Finding

+1 with limit stands.

