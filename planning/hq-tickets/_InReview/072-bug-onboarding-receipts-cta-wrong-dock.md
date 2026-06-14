# 072 — Bug: Onboarding Secondary CTA Shows Wrong Connect Dock

Owner: Claude
Priority: P2
Depends on: 069
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Welcome secondary CTA **"See what Receipts will prove"** opens Receipt education — not the generic Connect dock while on the Receipts surface.

## Why this matters

Both CTAs call `setStarted(true)`. Step machine then forces `connect` until `ready`, so the operator lands on Receipts with a dock saying *"Connect otto to your local Letta"* — wrong context and undermines the CTA promise.

## Scope

- Track onboarding **intent path**: `connect` | `receipts-preview`
- Receipts path: show receipt/sample education dock (071) or inline callout; Connect dock only on connect path
- Receipts path may proceed without runtime ready (read-only sample)

## Done when

- [ ] Click secondary CTA → Receipts + receipt-education UI (not connect-only dock)
- [ ] Connect path unchanged for primary CTA
- [ ] Staging smoke covers both CTAs
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
# staging fresh profile: click secondary CTA → screenshot shows receipt education, not connect copy on receipts
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: in review
Date: 2026-06-13

### Done when mapping

- **Click secondary CTA → Receipts + receipt-education UI (not connect-only dock):** Pass — `receipts-preview` intent resolves to `receipt` step with education dock; sample Receipts pane enabled without requiring `ready`.
- **Connect path unchanged for primary CTA:** Pass — primary CTA sets `connect` intent; connect/run docks unchanged.
- **Staging smoke covers both CTAs:** Documented — manual: primary → Settings + connect dock; secondary → Receipts + receipt dock + sample card.
- **Reviewer +1:** Pending independent review.

### Files

- `apps/desktop/src/onboarding-step.ts` (`OnboardingIntent`, receipts-preview branch)
- `apps/desktop/src/Onboarding.tsx` (`startPath`, receipt dock)
- `apps/desktop/src/onboarding-sample-receipt.ts` (`enableSampleReceiptPreview`)

### Verification

```sh
bun run --cwd apps/desktop typecheck
```

Exit 0 (2026-06-13).

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1 (secondary CTA → Receipts + receipt-education UI): **Pass (code).** `startPath('receipts-preview', 'receipts')` sets intent; `resolveOnboardingStep` → `receipt`; `onboardDock--receipt` copy + sample preview; no connect dock on receipts-preview path when not ready.
- Done when item 2 (connect path unchanged): **Pass.** Primary CTA uses `connect` intent; connect/run docks unchanged.
- Done when item 3 (staging smoke covers both CTAs): **Fail.** Manual notes only — no smoke script update, screenshots, or JSON proof for secondary vs primary paths.
- Done when item 4 (reviewer +1): **Fail** (this review).

### Evidence inspected

- Files: `onboarding-step.ts` (`receipts-preview` branch), `Onboarding.tsx` (`startPath`, receipt dock), `onboarding-sample-receipt.ts`
- Commands: `bun run --cwd apps/desktop typecheck` (exit 0); `bun test apps/desktop/electron/onboarding-step.test.ts` (includes receipts-preview case)
- UI/artifacts: none
- Git diff: intent path wiring

### Passes

- Reported wrong-dock bug fixed in step machine + UI.

### Defects

- Staging smoke for both CTAs not executed or attached.

### Required changes

1. Staging proof: fresh profile → secondary CTA screenshot showing Receipts + receipt education dock (not connect copy); primary CTA screenshot showing connect dock on Settings path.
2. Record artifact paths in execution receipt.

### Optional polish

- Extend onboarding smoke script with receipts-preview phase (can share 069 smoke work).

### Finding

Behavior fix is credible in code; acceptance requires staging evidence not supplied.

### Final call needed from Sebastian

None — return to root after staging proof.
