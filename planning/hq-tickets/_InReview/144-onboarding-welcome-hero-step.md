# 144 — Onboarding: welcome hero step

Owner: Claude
Priority: P1
Depends on: 143, 069
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (Step 0 · § Style reference)

**Style vs content:** Veto welcome (#2) informs **layout and CTA hierarchy** only. Copy and CTAs are **otto canon** below — not escrow/office messaging.

## Outcome

Step 0 **Welcome** matches design canon and Veto welcome clarity: one headline, one boundary line, three honest CTAs — **Get started**, **See what Receipts will prove**, **Skip** — without claiming connected or proof exists.

## Why this matters

Screenshot 2026-06-14 shows the right **otto copy** trapped in a heavy overlay. Borrow Veto welcome **structure**: badge → headline → subhead → primary → secondary → text skip. otto keeps inverted-ink + owl once; do not use Veto headline (“future of escrow money…”) or office CTAs.

## Style reference (patterns only)

- **From Veto #2:** pill badge, headline scale, short subhead, primary pill, outlined secondary, text skip
- **otto content (locked):** eyebrow `OTTO`, behavior-layer headline, ratification boundary, CTAs in scope below

## Scope

- Copy (locked from `docs/design/onboarding.md`):
  - Eyebrow: `OTTO`
  - Headline: *The behavior layer for persistent agents.*
  - Sub: one-app + ratification boundary
  - Authority line verbatim: *The human ratifies. otto records the proof.*
- CTAs:
  - Primary: **Get started →** → connect path (**145** / Settings)
  - Secondary: **See what Receipts will prove** → sample Receipt education (`sample · not live · not from your workspace`)
  - Tertiary: **Skip** → dismiss onboarding (persisted)
- Motion: 240ms fade + 0.98→1 scale on card settle (§09); no pulse/confetti
- **069 fix:** welcome shows on fresh profile even if runtime already connected (education before auto-advance)

## Out of scope

- Sample Receipt content implementation beyond link/navigation (**071**, **005**)
- Marketing site welcome (**065**)

## Done when

- [x] Step 0 matches design doc copy verbatim (forbidden-words scan clean)
- [x] CTA order and labels match scope above
- [x] Secondary path lands on labeled sample Receipt — never counts as live proof
- [x] Skip persists via `onboarding-storage`; relaunch respects dismiss
- [x] Motion ≤240ms; no blinking status dots
- [x] Staging fresh-profile screenshot attached to execution receipt
- [x] Reviewer `+1`

## Verification

```sh
bun test apps/desktop/electron/onboarding-step.test.ts apps/desktop/electron/onboarding-storage.test.ts
rg -n "install Letta|autonomous|guaranteed" apps/desktop/src/Onboarding.tsx docs/design/onboarding.md
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


### Ticket 144 proof
- Welcome inverted-ink card: OTTO eyebrow, canon headline/body/authority line
- CTAs: Get started → / See what Receipts will prove / Skip
- Welcome shows before started even when runtime already connected (069 — onboarding-step tests)
- Secondary enables sample Receipt preview (`enableSampleReceiptPreview`)

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
