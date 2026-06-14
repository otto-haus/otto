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
