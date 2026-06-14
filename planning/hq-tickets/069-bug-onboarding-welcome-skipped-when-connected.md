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

## Blocker log

Leave blank unless blocked.
