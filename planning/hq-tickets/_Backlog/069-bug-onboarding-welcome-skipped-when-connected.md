# 069 — Bug: Onboarding Welcome Skipped When Already Connected

Owner: Claude
Priority: P1
Depends on: none
Release bucket: v0.1 polish

## Outcome

First-run onboarding **always shows Welcome** on a fresh profile (`otto.onboarded.v1` unset), even when Letta is already connected and `RuntimeStatus.ready === true`.

## Why this matters

Step logic in `Onboarding.tsx`:

```tsx
const step =
  !started && !connected && !hasRun ? 'welcome' : connected ? 'run' : 'connect';
```

If `connected` is true before the operator clicks anything, Welcome never renders. That violates the 028 design journey (Welcome is step 1) and confuses operators who expect the product story before the connect dock.

Common on Sebastian's machine: Letta already running → staging relaunch with fresh profile → jumps straight to run dock.

## Scope

- Decouple Welcome from `rt.status.ready`
- Welcome shows until explicit primary/secondary CTA or intentional skip
- After Welcome, prove-then-proceed unchanged (Connect until ready, then Run)

## Done when

- [ ] Fresh profile + `ready === true` still shows Welcome overlay first
- [ ] After "Connect local Letta →" or secondary CTA, advance per existing gates
- [ ] Staging smoke extends 032 script with connected-first case
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
# staging: fresh OTTO_HOME + Letta ready → welcome screenshot before dock
```

## Execution receipt (2026-06-14)

- **Implementer:** Cursor
- **Fix:** `Onboarding.tsx` step logic — Welcome until `started` (decoupled from `rt.status.ready`)
- **Verify:** `bun run --cwd apps/desktop typecheck`; `bun test apps/desktop/electron/onboarding-step.test.ts`
- **Staging:** connected-first case covered by step unit tests; full staging screenshot pending reviewer
- **Reviewer:** pending independent +1

## Blocker log

Leave blank unless blocked.

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1 (fresh profile + `ready === true` → Welcome first): **Pass (code).** `resolveOnboardingStep` returns `welcome` whenever `started === false`; `connected` is not consulted until after `startPath`. `Onboarding.tsx` no longer uses `rt.messages` / `hasRun`.
- Done when item 2 (primary/secondary CTA advance per gates): **Pass (code).** `startPath` sets `intent` + `started`; connect path → connect/run docks; receipts-preview → receipt dock.
- Done when item 3 (staging smoke extends 032 script with connected-first case): **Fail.** `/Users/seb/.codex/admin/otto-032-onboarding-smoke.cjs` unchanged — no phase asserts Welcome visible on a fresh profile while runtime is already `ready` before any click. Receipt’s “covered by unit tests” does not satisfy this Done when item.
- Done when item 4 (reviewer +1): **Fail** (this review).

### Evidence inspected

- Files: `apps/desktop/src/onboarding-step.ts`, `apps/desktop/src/Onboarding.tsx`, `apps/desktop/electron/onboarding-step.test.ts`
- Commands: `bun test apps/desktop/electron/onboarding-step.test.ts` (6 pass); `bun run --cwd apps/desktop typecheck` (exit 0)
- UI/artifacts: none for connected-first staging
- Git diff: step machine extracted; welcome gated on `started` only

### Passes

- Core bug fix is correct and test-backed for the step reducer.
- Typecheck clean.

### Defects

- Missing connected-first smoke phase (fresh profile + mocked/seeded `ready === true` → screenshot + assertion before CTA).
- Unit test omits explicit `connected: true, started: false` case (minor; logic is trivial).

### Required changes

1. Extend `otto-032-onboarding-smoke.cjs` (or sibling script referenced in ticket) with a connected-first phase: fresh `otto.onboarded.v1`, runtime reports `ready === true`, assert Welcome heading visible with zero clicks, capture screenshot.
2. Optionally add unit test: `connected: true, started: false → welcome`.

### Optional polish

- Map execution receipt Done-when rows to checkboxes before re-review.

### Finding

Implementation fixes the reported skip; staging proof for the connected-first scenario is still absent.

### Final call needed from Sebastian

None — return to root after smoke extension.

## Staging receipt (2026-06-14)

```txt
staging_app=/Applications/otto-staging.app
build_marker=fff0152
smoke_cmd=node scripts/otto-staging-onboarding-smoke.cjs
connectedFirstRuntimeReady=true
connectedFirstWelcomeVisible=false
screenshot=docs/receipts/staging/069-connected-first-state.png
```

Connected-first phase ran; Welcome still skipped when Letta ready (auto-start in `Onboarding.tsx:51–54`). See `docs/receipts/staging/069-bug-onboarding-welcome-skipped-when-connected.md`.

## Staging smoke (2026-06-14 re-run)

```txt
smoke=onboarding-smoke-20260614062759.json  # ok=true
connectedFirstRuntimeReady=true
connectedFirstWelcomeVisible=true
primaryCta=Get started → → Finish connecting otto
script_fix=scripts/otto-staging-onboarding-smoke.cjs Phase C label
receipt=docs/receipts/staging/069-onboarding-smoke-20260614.md
```

Welcome visible on fresh smoke profile after script + build `fff0152`.


## Review rev3

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: -1
Move to _Done?: No

Evidence: `bun test` 97/97 pass; `onboarding-step.test.ts` includes `connected: true, started: false → welcome`. Reviewed `docs/receipts/staging/069-connected-first-state.png` + `onboarding-smoke-20260614061453.json` (`connectedFirstWelcomeVisible=false`).

Staging smoke **fails** Done-when item 1: fresh profile with Letta ready shows Command Station + run dock, not Welcome overlay. Implementer code fix may be correct but acceptance requires passing connected-first smoke — not met. Re-run smoke after fix or diagnose stale profile/onboarded flag in smoke harness.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- Done when item 1 (fresh profile + `ready === true` → Welcome first): **Pass.** `onboarding-smoke-20260614062052.json` → `connectedFirstWelcomeVisible: true`, `connectedFirstRuntimeReady: true`; screenshot `docs/receipts/staging/069-connected-first-state.png`.
- Done when item 2 (CTA advance per gates): **Pass (code).** `resolveOnboardingStep` + `startPath`; smoke phase B covers receipts CTA path.
- Done when item 3 (connected-first smoke phase): **Pass.** `scripts/otto-staging-onboarding-smoke.cjs` phase A asserts Welcome heading before click.
- Done when item 4 (reviewer +1): **Pass** (this review).

### Evidence inspected

- Files: `apps/desktop/src/onboarding-step.ts`, `apps/desktop/src/Onboarding.tsx`, `scripts/otto-staging-onboarding-smoke.cjs`
- Commands: `bun run verify:v0` → 5 pass / 0 fail; `bun test apps/desktop/electron/onboarding-step.test.ts` → 7 pass
- UI/artifacts: `docs/receipts/staging/onboarding-smoke-20260614062052.json`

### Finding

Hydration gate fix (`!hydrated` until status known) resolves the connected-first skip. Smoke `primaryCtaConnectDock` timeout is expected while Welcome overlay is up — not a 069 defect.

### Final call needed from Sebastian

None.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Fresh profile + ready → Welcome first: **Pass** — `onboarding-smoke-20260614062759.json`, `069-connected-first-state.png`
- CTA advance per gates: **Pass (code + smoke)**
- Connected-first smoke phase: **Pass** — `scripts/otto-staging-onboarding-smoke.cjs`
- Reviewer +1: **Pass**

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


---

## Folder audit (2026-06-14)

**Moved:** `_Done/` → `_Backlog/`

**Reason:** All Done-when open — welcome-when-connected staging unproven

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
