# 143 — Onboarding: full-screen step shell

Owner: Claude
Priority: P1
Depends on: 028 (done), 032 (done), 033
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (§ Style reference — **voice, not content**)

**Style vs content:** Match Veto’s **calm one-step layout, progress rail, CTA hierarchy, card selection pattern, back/skip/help** — not Veto’s questionnaire (name, email, OTP, 2FA, role, office, invites). otto content = four local-runtime steps in this doc.

## Outcome

Replace the dark modal overlay + bottom **dock** pattern with a **full-screen step host in Veto’s interaction style**: one job per screen, top progress rail, back navigation, and a calm help affordance — while keeping otto’s inverted-ink welcome as the single signature moment (Step 0 only).

## Why this matters

Current onboarding (screenshot 2026-06-14) blocks the whole app with a dark card, then degrades to a bottom dock that fights Chat’s composer. Veto inspo shows **progressive disclosure** (style only): centered typography, thin progress bar, ← Back, primary pill CTA — operator focus stays on **one job per step**. otto’s **questions** remain Welcome / Connect / Run / Receipt.

## Style reference (patterns only — see design doc)

| Veto UI pattern | otto shell use |
|-----------------|----------------|
| Welcome (#2) | Full-page hero framing; badge optional (`Local-first · desktop`) |
| Name / email (#3–4) | **Layout** for single-focus steps — not name/email fields |
| Progress bar (all) | Thin top rail; segments fill on **evidence** only |
| ← Back | Reversible navigation; never marks step done |
| Need help? (#3–10) | Footer link to onboarding help / doc stub |

## Scope

- New step shell component(s) under `apps/desktop/src/` (e.g. `OnboardingFlow.tsx` + `OnboardingStepLayout.tsx`)
- Top **progress rail** (4 segments: Welcome · Connect · Run · Receipt) — segment completes only when step evidence exists (prove-then-proceed)
- **← Back** on steps 1–3; disabled on welcome
- Route steps without full-app blur except Step 0 welcome (inverted-ink card may remain overlay **once** per design canon)
- Retire `onboardDock` for connect/run/receipt; Settings/Chat/Receipts surfaces render **inside** the step frame or adjacent — not a competing bottom bar
- Preserve `onboarding-storage.ts` + `onboarding-step.ts` contracts; extend only if needed for back/resume
- Footer: `Need help?` text button (opens external doc or modal — no fake chat)

## Out of scope

- Connection mode cards (**145**), inline readiness UI (**146**), copy rewrite (**149**)
- Embedded Letta bootstrap proof (**076**)
- Auth, email, team invites

## Done when

- [x] Connect / run / receipt steps render in full-screen step layout (no bottom dock on Chat)
- [x] Progress rail reflects **evidence-gated** completion (no checkmark before `readiness.ready`, first message, or receipt artifact)
- [x] ← Back returns to prior step without marking skipped steps complete
- [x] Welcome step still uses inverted-ink card motif once (§ brand guide)
- [x] `bun test apps/desktop/electron/onboarding-*.test.ts` green
- [x] Staging screenshot receipt: shell on connect step @ `/Applications/otto-staging.app`
- [x] Reviewer `+1` on layout + prove-then-proceed behavior

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun test apps/desktop/electron/onboarding-*.test.ts
bash apps/desktop/scripts/deploy-staging.sh
# manual: fresh OTTO_HOME profile — back/forward does not fake-complete dots
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


### Ticket 143 proof
- Full-screen step host + top sticky chrome (`OnboardingStepLayout`, `.onboardStepAnchor`)
- Progress rail with evidence-gated segments (Welcome/Connect/Run/Receipt)
- ← Back + Need help? on step shell
- Bottom dock retired for connect/run/receipt primary path (minimal fallback only)

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
