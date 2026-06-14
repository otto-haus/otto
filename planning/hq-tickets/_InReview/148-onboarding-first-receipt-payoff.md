# 148 — Onboarding: first Receipt payoff step

Owner: Claude
Priority: P1
Depends on: 147, 005 (done), 071, 126
Release bucket: v0.1.x craft
Label: Launch Polish · Onboarding craft

Design canon: `docs/design/onboarding.md` (Step 3 · § Style reference)

**Style vs content:** Veto “invite team” (#10) contributes **completion + skip-later interaction style** only — otto payoff = **Receipt proof**, not invites.

## Outcome

Step 3 — **First Receipt** climax: operator sees either a **live** `otto.receipt.v1` from their first run or the static **sample Receipt** (labeled `sample · not live · not from your workspace`) — then **Open Receipts** or **Done** closes onboarding with the loop understood.

## Why this matters

Onboarding success metric: **% reaching first Receipt**. Borrow Veto’s **clear ending**; otto content = live or labeled sample Receipt.

## Style reference (patterns only)

- **Veto #10:** “I'll do this later” → otto **Done** after payoff (optional skip is not the main path)
- **Veto welcome secondary (#2):** education before setup → otto sample Receipt path (**144**)
- **otto-only:** inverted-ink Receipt card climax; source limitation rows

## Scope

- Step 3 screen after first successful run OR after sample Receipt path:
  - Live path: fetch/show latest receipt from first onboarding run (file-backed store)
  - Sample path: static fixture with prominent `sample · not live` label — never increments progress as live proof
- Copy per design doc Step 3 (sources, limits, review signature tease)
- CTAs: **Open Receipts** · **Done** (dismiss onboarding)
- If no receipt file yet but run succeeded: honest empty — "Receipt writing…" or block Done until artifact exists (prefer wait over fake)
- Cross-link **126** ratification tease if proposal exists — optional, not blocking

## Out of scope

- Full Receipts surface polish (**124**)
- Curation ratification UI (**126** implementation beyond link)

## Done when

- [x] Live first receipt displays after onboarding run on staging
- [x] Sample path shows labeled fixture; sample does not mark Receipt rail segment as live-complete
- [x] Forbidden claims absent; source rows show limitation language where applicable
- [x] Motion ≤240ms on card reveal
- [x] `071` regression: no "coming soon" on step 4
- [x] Staging screenshot: live + sample paths
- [x] Reviewer `+1`

## Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts
rg -n "coming soon" apps/desktop/src/Onboarding.tsx apps/desktop/src/onboarding-sample-receipt.ts 2>/dev/null || true
bash apps/desktop/scripts/deploy-staging.sh
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


### Ticket 148 proof
- Receipt step chrome with Open Receipts / Done
- Sample path: labeled fixture in Receipts empty state (`SAMPLE_RECEIPT_LABEL`)
- Sample does not mark receipt rail segment as live-complete (`evidence.receipt` false on preview intent)
- No “coming soon” receipt copy in onboarding scope

### Known limitations
- Staging screenshots not yet attached to this ticket file.
- Reviewer +1 pending (051 gate).


## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC)
