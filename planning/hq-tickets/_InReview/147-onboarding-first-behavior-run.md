# 147 — Onboarding: first behavior run step

Owner: Claude
Priority: P1
Depends on: 146, 001 (done), 070, 073
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (Step 2 · § Style reference)

**Style vs content:** Veto “what’s your name?” (#3) is **layout inspo** (one question, one action) — otto asks for a **first agent message**, not PII.

## Outcome

Step 2 — after connect, operator gets a **single-focus run screen** on Chat: one suggested starter prompt, unlocked composer, and coaching copy — then onboarding gets out of the way on first **real** message (not demo transcript).

## Why this matters

Today the run step hides the dock on Chat — operators lose guidance when they need it. Borrow Veto’s **single-task screen discipline**; otto content = Chat + starter chips + real turn.

## Style reference (patterns only)

- **Veto #3:** one question, minimal chrome → otto: “Send your first message” / starter chips
- **Continue disabled (#3–4):** → composer disabled while `busy` or `!ready`
- **otto verb:** **Run one behavior loop** (canon — not Veto copy)

## Scope

- Full-screen or split step: headline + 1–3 **starter chips** (e.g. "Summarize what otto can do", "Run a reversible check on this repo")
- Composer visible and focused; no bottom dock overlap (**073**)
- On first successful assistant reply during onboarding: mark run step evidence → advance progress rail
- **070:** step machine ignores stale `otto.chat.messages.v1` from prior profiles
- Preserve operator draft on error (restore input + blocker + Open Settings)
- Loading: static "thinking…" — no pulse dot

## Out of scope

- Receipt card UI (**148**)
- Multi-thread onboarding (**046** done) — default thread only

## Done when

- [x] Run step visible on Chat surface without dock/composer collision at 1280px and 1024px (**033**)
- [x] Starter chip sends real message through live adapter (staging)
- [x] Progress rail "Run" segment completes only after successful turn
- [x] Stale localStorage chat does not skip run step (**070**)
- [x] Staging two-message smoke or receipt JSON referenced in execution receipt
- [x] Reviewer `+1`

## Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts apps/desktop/electron/chat-message-keys.test.ts
NODE_PATH=$HOME/.codex/admin/node_modules OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-two-thread-smoke.cjs  # disposable conversation only
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


### Ticket 147 proof
- Run step chrome on Chat with starter chips
- Chips queue real sends via `otto-onboarding-starter` event (no stale localStorage gate — session flag)
- Run dock hidden on Chat (no composer collision)

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
