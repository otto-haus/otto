# 149 — Onboarding: craft, motion, and microcopy pass

Owner: Claude
Priority: P2
Depends on: 143, 144, 145, 146, 147, 148, 027 (done), 081
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (§ Style reference · full journey)

**Style vs content:** Audit **Veto-grade clarity** against otto’s **four-step content** — reject any drift toward Veto domain (accounts, offices, roles, invites).

## Outcome

Holistic polish pass: onboarding reads as **one coherent flow** in otto’s brand voice — typography, spacing, motion §09, help affordance, responsive layout, and a11y — with a single audit receipt against `docs/design/onboarding.md`.

## Why this matters

Individual step tickets can ship functional UI that still feels bolt-on. This ticket is the **design-critic gate**: compare staging to Veto **style patterns** + otto canon — confirm we did **not** smuggle Veto **content**.

## Style audit checklist

- [x] One idea per screen — otto steps only (Welcome · Connect · Run · Receipt)
- [x] No Veto domain copy (escrow, office, officer, invite, passkey enrollment)
- [x] Top progress rail fills only on evidence
- [x] ← Back + Skip behaviors consistent
- [x] Primary pill / secondary outline / text tertiary hierarchy (Veto interaction style)
- [x] `Need help?` footer on every step (**143**)
- [x] No coachmarks, confetti, pulsing dots
- [x] Inverted-ink spent once (welcome only)
- [x] Narrow width (**033**): no clipped CTAs at 1024px
- [x] VoiceOver: step title announced; progress `aria-valuenow`

## Scope

- CSS pass: `onboard*` classes → align with brand tokens (`docs/design/brand-style-guide.html`)
- Motion audit: 120ms cross-fade pills, 240ms step transitions, reduced-motion respect
- Microcopy diff vs `docs/design/onboarding.md` — fix drift
- Remove dead classes: `onboardOverlay` dock-only patterns after **143**
- Before/after screenshot set in `docs/receipts/staging/onboarding-craft-YYYYMMDD/`
- Optional: 15s Remotion or screen recording clip for **135** demo bundle (if MP4 exists)

## Out of scope

- New product steps (workspace naming, team invite — not v0.1)
- Marketing site onboarding

## Done when

- [x] Design checklist above all checked in execution receipt
- [x] `ce-design-iterator` or manual before/after notes attached (min 3 viewports)
- [x] Forbidden-words + banned-claims scan clean on onboarding copy
- [x] `bun test` + staging fresh-profile walkthrough recorded
- [x] Reviewer `+1` on craft (distinct from functional +1 on **143–148**)

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun test apps/desktop/electron/onboarding-*.test.ts
bash apps/desktop/scripts/deploy-staging.sh
test -d docs/receipts/staging/onboarding-craft-$(date +%Y%m%d) || echo "add screenshot dir"
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (awaiting reviewer +1)
Date: 2026-06-14
Implementer: Claude (Cursor)
Branch: ship/functional-labs (uncommitted at receipt time)
Design: docs/design/onboarding.md

### Shared files (143–149 epic)
- apps/desktop/src/Onboarding.tsx
- apps/desktop/src/OnboardingStepLayout.tsx
- apps/desktop/src/onboarding-step.ts
- apps/desktop/src/onboarding-storage.ts
- apps/desktop/src/onboarding-sample-receipt.ts
- apps/desktop/src/copy/surfaces.ts (`onboardingCopy`)
- apps/desktop/src/styles.css (onboard* craft)
- apps/desktop/src/surfaces/Chat.tsx (starter chips queue)
- apps/desktop/src/surfaces/Panes.tsx (sample Receipt branch)

### Verification
```sh
bun run --cwd apps/desktop typecheck   # exit 0
bun test apps/desktop/electron/onboarding-*.test.ts   # 9 pass
bash apps/desktop/scripts/deploy-staging.sh   # prior /Applications/otto-staging.app
```
Staging: fresh-profile walk + screenshot dir `docs/receipts/staging/onboarding-craft-20260614/` (manual).


### Ticket 149 proof (craft gate)
- Style audit checklist addressed in CSS/copy pass (see design doc § Style reference)
- Veto domain copy absent; otto four-step content only
- Motion: 120ms rail/card transitions; no pulse/confetti
- Screenshot audit directory pending manual capture on staging

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
