# 071 — Bug: Onboarding Missing Step 4 + Sample Receipt (Design Drift)

Owner: Claude
Priority: P1
Depends on: 005, 032
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Onboarding completes the **028 / `otto-onboarding.md` journey**: Welcome → Connect → First loop → **First Receipt**, including the agreed **static sample Receipt** (`sample · not live · not from your workspace`).

## Why this matters

032 shipped a 3-step subset. Receipts surface is live (005 `_Done`). Current run-step copy still says *"Your first Receipt will appear here once Receipts land"* — false and a fake-done smell.

028 review recorded Sebastian's decision: include sample Receipt education; connect via Settings is acceptable.

## Scope

- Add step 4 (or extend run step) to navigate to Receipts with sample card pinned when no live receipts
- Implement sample receipt fixture in Receipts pane OR onboarding-only panel — clearly labeled non-live
- Update run-step copy to point at real receipt creation path
- Align dots indicator to 4 steps (or document 3+receipt sub-step)

## Out of scope

- Full in-app HTML one-pager viewer
- Auto-creating a live receipt without a real chat turn

## Done when

- [ ] Operator can inspect sample Receipt structure during onboarding
- [ ] Sample labeled: `sample · not live · not from your workspace`
- [ ] No copy claims Receipts are "coming soon"
- [ ] Staging screenshot: run step + sample receipt view
- [ ] Reviewer +1 (lexicon / no forbidden claims)

## Verification

```sh
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# manual: secondary CTA + run step → sample receipt visible
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: in review
Date: 2026-06-13

### Done when mapping

- **Operator can inspect sample Receipt structure during onboarding:** Pass — secondary CTA + receipt dock navigate to Receipts with pinned sample split view when no live receipts.
- **Sample labeled `sample · not live · not from your workspace`:** Pass — `SAMPLE_RECEIPT_LABEL` on card, detail path, and toolbar chip.
- **No copy claims Receipts are "coming soon":** Pass — run-step copy references real `otto.receipt.v1` creation path.
- **Staging screenshot: run step + sample receipt view:** Pending manual staging capture after deploy.
- **Reviewer +1:** Pending independent review.

### Files

- `apps/desktop/src/onboarding-sample-receipt.ts` (new fixture)
- `apps/desktop/src/onboarding-step.ts` (receipt step + 4 dots)
- `apps/desktop/src/Onboarding.tsx` (receipt dock, updated run copy)
- `apps/desktop/src/surfaces/Panes.tsx` (sample Receipts empty-state branch)

### Verification

```sh
bun run --cwd apps/desktop typecheck
```

Exit 0 (2026-06-13). Staging screenshot pending deploy smoke.

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1 (inspect sample Receipt structure during onboarding): **Pass (code).** `enableSampleReceiptPreview()` + `Panes.tsx` sample split view with `ReceiptDetailView`.
- Done when item 2 (sample labeled `sample · not live · not from your workspace`): **Pass.** `SAMPLE_RECEIPT_LABEL` on toolbar chip, card path, and detail fixture.
- Done when item 3 (no “coming soon” Receipt copy): **Pass.** Run-step copy references `otto.receipt.v1`; no onboarding Receipt “coming soon” string in scope files.
- Done when item 4 (staging screenshot: run step + sample receipt view): **Fail.** Receipt admits pending; no screenshot path or smoke JSON in ticket.
- Done when item 5 (reviewer +1): **Fail** (this review).

### Evidence inspected

- Files: `onboarding-sample-receipt.ts`, `onboarding-step.ts`, `Onboarding.tsx`, `Panes.tsx` (sample branch)
- Commands: `bun run --cwd apps/desktop typecheck` (exit 0)
- UI/artifacts: none staged
- Git diff: 4-step dots, receipt dock, sample fixture wired

### Passes

- 028 journey step 4 implemented in code with honest labeling.
- Lexicon clean on inspected onboarding/receipt copy.

### Defects

- No staging proof artifact for run step + sample receipt view.

### Required changes

1. Deploy staging (`apps/desktop/scripts/deploy-staging.sh`), capture screenshot(s) for run dock + sample Receipt surface, record paths in execution receipt.
2. Re-submit for review.

### Optional polish

- Sample preview flag is in-memory only (resets on reload) — acceptable for onboarding session but note in receipt if intentional.

### Finding

Code complete; Done when requires visual staging proof that is still missing.

### Final call needed from Sebastian

None — return to root after staging capture.

## Staging receipt (2026-06-14)

```txt
staging_app=/Applications/otto-staging.app
build_marker=fff0152
smoke_cmd=node scripts/otto-staging-onboarding-smoke.cjs
receiptsCtaShowsSample=true
screenshot=docs/receipts/staging/071-072-receipts-sample-onboarding.png
```

Secondary CTA shows visible **Sample proof record** on Receipts. See `docs/receipts/staging/071-bug-onboarding-missing-receipt-step-sample.md`.

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Move file: `071-bug-onboarding-missing-receipt-step-sample.md`

Evidence: `bun run verify:v0` 5/5 pass. Reviewed `docs/receipts/staging/071-072-receipts-sample-onboarding.png` + `onboarding-smoke-20260614061453.json` (`receiptsCtaShowsSample=true`). PNG shows **Sample proof record**, onboarding education dock, and sample split view — not connect dock.

Done-when staging screenshot satisfied. Sample labeling and no “coming soon” copy verified in prior code review.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Sample receipt + labels + staging screenshot: **Pass** — `071-072-receipts-sample-onboarding.png`, unit tests

### Finding

Reconfirmed +1.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; no rev9 delta.
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.


---

## Folder audit (2026-06-14)

**Moved:** `_Done/` → `_Backlog/`

**Reason:** All Done-when open — sample receipt step + screenshots missing

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
