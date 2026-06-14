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
