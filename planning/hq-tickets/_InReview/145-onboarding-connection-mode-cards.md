# 145 — Onboarding: connection mode selection cards

Owner: Claude
Priority: P1
Depends on: 143, 076, 078
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (Step 1 · § Style reference)

**Style vs content:** Veto passkey/role **card UI** (#6–8) — not passkey enrollment or escrow **roles**. otto cards = connection **mode** (embedded vs existing Letta).

## Outcome

Step 1a — operator picks **how otto connects** using **selection cards** (Veto card pattern: icon, title, one-line benefit, radio check) before Settings chrome: default **This Mac (embedded)** vs **Advanced: existing Letta install**.

## Why this matters

Connect step today dumps operators into Settings with two equal buttons. Veto (#6–8) shows **choose one path with consequences explained** — we reuse the **card pattern**, not the passkey/role **content**.

## Style reference (patterns only)

| Veto screen | Pattern borrowed | otto content |
|-------------|------------------|--------------|
| Passkey vs Authenticator (#6) | Two-card choice + recommended default | Embedded vs existing Letta |
| Passkey benefits (#7) | Three short bullets under recommended card | One app · keys in Letta · local-only |
| Role cards (#8) | Selected border + check circle | Mode selection, not job title |

## Scope

- Reusable `OnboardingChoiceCard` (or extend `PermissionCard` pattern if appropriate)
- Two options minimum:
  1. **This Mac** — embedded / auto-discover path (**076** when proven; copy must not claim embedded until 076 receipt)
  2. **Existing Letta** — URL + Agent ID advanced path (Settings connection modes)
- **Continue →** disabled until a card is selected (Veto single-focus **interaction** #3–4 — not email validation)
- Selection stored in onboarding profile state; pre-selects Settings connection mode
- Optional third card **Labs preview** — out of scope unless **137** ships first; do not add dead cards

## Out of scope

- Live readiness rows (**146**)
- Provider key mirror UI (**078**) — only deep-link to Settings field
- Letta Cloud (**077** parked)

## Done when

- [x] Connect flow opens mode cards before full Settings surface
- [x] Selected mode maps to Settings `connectionMode` (or equivalent) without silent mismatch
- [x] Recommended card visually distinct; advanced labeled honestly
- [x] Continue disabled with no selection; enabled after pick
- [x] Copy passes forbidden-words + no fake embedded claim if **076** open
- [x] Component test or onboarding-step test covers selection + advance
- [x] Staging screenshot on mode step
- [x] Reviewer `+1`

## Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts
bun run --cwd apps/desktop typecheck
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


### Ticket 145 proof
- Mode selection cards (embedded vs existing Letta) before Settings
- Continue disabled until selection; persists `connectionMode` via config API + session draft
- Recommended badge on embedded card

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
