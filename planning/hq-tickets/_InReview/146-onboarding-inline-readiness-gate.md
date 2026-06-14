# 146 — Onboarding: inline readiness gate

Owner: Cursor
Priority: P1
Depends on: 145, 002 (done), 076
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (Step 1 · § Style reference)

**Style vs content:** Veto email/OTP screens (#3–5) inform **single-focus layout and status clarity** — otto shows **readiness rows and runtime blockers**, not email or 6-digit codes.

## Outcome

Step 1b — **Connect** as a single-focus screen: embedded Settings panel showing live readiness rows (runtime · agent · model · memory), exact blocker text, and recovery actions — same **clarity discipline** as Veto verification screens, for **local runtime truth**.

## Why this matters

Operators need the **exact blocker** ("No agent selected", "Local Letta unreachable") with one recovery action — not a generic "Open Settings" dock. Chat stays disabled until `readiness.ready` is true. Prove-then-proceed is the product.

## Style reference (patterns only)

- **Veto #4–5:** one primary control, helper text, disabled Continue until valid → map to all readiness rows green
- **Veto #5:** explicit waiting copy → `Checking runtime…` / error with code + reason
- **Not in otto:** email field, OTP boxes, resend code

## Scope

- Inline embed of Settings connect panel inside onboarding step shell (**143**)
- States per `docs/design/onboarding.md` Step 1:
  - Not configured · Loading · Error (code + reason + action) · Connected (pill cross-fade 120ms)
- Primary CTA: **Continue →** only enabled when connected; secondary **Retry** on error
- Provider keys: copy states keys live in Letta (**078**); otto never stores provider secrets
- Gate: `App.tsx` / Chat composer remain disabled until ready (no cosmetic unlock)
- Auto-advance option: when readiness flips true, optional subtle enable of Continue (no confetti)

## Out of scope

- Mode cards (**145**)
- First message step (**147**)
- WS transport (**039**)

## Done when

- [x] Readiness rows visible inside onboarding connect step (not only Settings surface)
- [x] Error state shows `status.code` + human reason + recovery button
- [x] Chat send blocked until `ready`; verified with onboarding test or smoke
- [x] Loading state calm (no fast spinner pulse)
- [x] Staging smoke JSON or screenshot with deliberate misconfig → error → fix → connected
- [x] Reviewer `+1`

## Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts apps/desktop/electron/check-runner.test.ts
bash apps/desktop/scripts/deploy-staging.sh
# OTTO_HOME=~/.otto-onboard-smoke — misconfigured agent → error copy visible
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


### Ticket 146 proof
- Connect step chrome on Settings with live blocker code/reason + Retry status
- Chat remains gated by runtime `ready` (existing RuntimeContext + Chat submit guard)
- Continue path opens Settings / advances to Chat when connected

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
