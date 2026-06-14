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
