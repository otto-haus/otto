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

## Staging receipt (2026-06-14)

```txt
staging_app=/Applications/otto-staging.app
build_marker=fff0152
smoke_cmd=node scripts/otto-staging-onboarding-smoke.cjs
receiptsCtaNotConnectDock=true
primaryCtaConnectDock=true
screenshots=docs/receipts/staging/071-072-receipts-sample-onboarding.png,072-primary-connect-dock.png
```

Both CTA paths verified in automated smoke. See `docs/receipts/staging/072-bug-onboarding-receipts-cta-wrong-dock.md`.

## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Move file: `072-bug-onboarding-receipts-cta-wrong-dock.md`

Evidence: `bun run verify:v0` 5/5 pass. Reviewed `071-072-receipts-sample-onboarding.png` (secondary → Receipts + sample education) and `072-primary-connect-dock.png` (primary → connect dock on Settings). `onboarding-smoke-20260614061453.json`: `receiptsCtaNotConnectDock=true`, `primaryCtaConnectDock=true`.

Both CTA paths proven in automated staging smoke.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Receipts CTA path + connect path: **Pass** — onboarding smoke JSON + `072-primary-connect-dock.png`

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
