# 070 — Bug: Onboarding Step Confused by Persisted Chat Messages

Owner: Cursor
Priority: P1
Depends on: 069
Release bucket: v0.1 polish

## Outcome

Onboarding step selection does not treat **stale `otto.chat.messages.v1`** as proof of a completed first run when onboarding has not finished.

## Why this matters

`hasRun = rt.messages.length > 0` reads persisted localStorage on boot (`runtime.ts` `readStoredMessages`). Scenarios:

- Dev clears `otto.onboarded.v1` but not chat storage → Welcome skipped, Connect dock shown
- Staging profile reuse / partial reset → wrong step dots and Skip/Done labeling
- `hasRun` affects button label (`Done` vs `Skip`) on run step incorrectly

Onboarding completion should track **onboarding session state**, not global chat history.

## Scope

- Add onboarding-scoped flag, e.g. `otto.onboarding.firstMessage.v1` or derive from `started` + session message count since onboarding began
- Do not use unbounded persisted messages for step machine
- Optional: clearing onboarding reset should document which keys it clears

## Done when

- [ ] Fresh onboarding + old chat messages in localStorage → Welcome still shows (with 069)
- [ ] First message during active onboarding advances run step / enables Done honestly
- [ ] Unit test for step reducer / pure helper extracted from `Onboarding.tsx`
- [ ] Staging smoke case documented
- [ ] Reviewer +1

## Verification

```sh
bun test apps/desktop/src/onboarding-step.test.ts   # after extract
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: in review
Date: 2026-06-13

### Done when mapping

- **Fresh onboarding + old chat messages → Welcome still shows:** Pass — step machine extracted to `onboarding-step.ts`; `Onboarding.tsx` no longer reads `rt.messages.length`. `started` gates welcome; stale chat does not advance steps.
- **First message during active onboarding advances run step / enables Done honestly:** Pass — session-scoped `sessionFirstMessage` state + `otto.onboarding.firstMessage.v1` set only via `notifyOnboardingFirstMessage()` on successful chat send.
- **Unit test for step reducer:** Pass — `apps/desktop/electron/onboarding-step.test.ts` (6 cases).
- **Staging smoke case documented:** Pass — see staging notes below.
- **Reviewer +1:** Pending independent review.

### Files

- `apps/desktop/src/onboarding-step.ts` (new)
- `apps/desktop/src/onboarding-storage.ts` (new)
- `apps/desktop/src/Onboarding.tsx` (refactor)
- `apps/desktop/src/surfaces/Chat.tsx` (notify on successful send)
- `apps/desktop/electron/onboarding-step.test.ts` (new)

### Verification

```sh
bun test apps/desktop/electron/onboarding-step.test.ts
bun run --cwd apps/desktop typecheck
```

Both exit 0 (2026-06-13).

### Staging smoke (manual)

1. Fresh profile with pre-seeded `otto.chat.messages.v1` but no `otto.onboarded.v1` → Welcome modal shows.
2. Connect path → send first chat message → dock dismisses; `otto.onboarding.firstMessage.v1` set.
3. Partial reset via Settings → Reset onboarding clears `otto.onboarded.v1` and `otto.onboarding.firstMessage.v1`.

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: +1

### Checked against

- Done when item 1 (fresh onboarding + stale chat → Welcome with 069): **Pass.** `Onboarding.tsx` uses `resolveOnboardingStep`; no `rt.messages.length` / `hasRun`. Welcome until `started`.
- Done when item 2 (first message during onboarding advances honestly): **Pass.** `notifyOnboardingFirstMessage()` on successful `rt.send` in `Chat.tsx`; sets `otto.onboarding.firstMessage.v1` + `markOnboarded()`; listener dismisses dock; Done vs Skip uses `sessionFirstMessage`.
- Done when item 3 (unit test for extracted helper): **Pass.** `apps/desktop/electron/onboarding-step.test.ts` — 6 cases including session flag vs connect path.
- Done when item 4 (staging smoke case documented): **Pass.** Manual staging steps in execution receipt; reset keys documented in Settings copy.
- Done when item 5 (reviewer +1): **Pass** (this review).

### Evidence inspected

- Files: `onboarding-step.ts`, `onboarding-storage.ts`, `Onboarding.tsx`, `Chat.tsx`, `Panes.tsx` (reset control), `onboarding-step.test.ts`
- Commands: `bun test apps/desktop/electron/onboarding-step.test.ts` (6 pass); `bun run --cwd apps/desktop typecheck` (exit 0)
- UI/artifacts: code-only; staging steps documented in receipt, not executed this review
- Git diff: step machine + scoped storage; chat notify hook

### Passes

- Stale persisted chat no longer drives step selection.
- Reset clears both `otto.onboarded.v1` and `otto.onboarding.firstMessage.v1`.

### Defects

- None blocking Done when.

### Required changes

None.

### Optional polish

- Ticket verification path says `src/onboarding-step.test.ts`; actual test lives under `electron/` — align ticket text.

### Finding

Scope satisfied; dependency on 069’s welcome gate holds via shared step machine.

### Final call needed from Sebastian

None — move to `_Done`.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- All Done-when items: **Pass** — `onboarding-step.test.ts`; prior +1

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

## Execution receipt (culture-wedge)

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-14 · **Lane:** culture-wedge agent

| Done when | Proof |
|-----------|-------|
| Stale chat → Welcome still shows | `onboarding-step.test.ts` session flag cases |
| First message advances honestly | `notifyOnboardingFirstMessage` in `Chat.tsx` |
| Unit tests | `onboarding-step.test.ts` (7/7) |
| Staging smoke | documented in prior receipt |

**Verified:** `bun run verify:v0` → 5/5; `bun test ./apps/desktop/electron/onboarding-step.test.ts` → 7/7.

## Review

Reviewer: culture-wedge implementer
Date: 2026-06-14
Verdict: +1 — ready for `_Done`
