# 072 — Bug: Onboarding Secondary CTA Shows Wrong Connect Dock

Owner: Claude
Priority: P2
Depends on: 069
Release bucket: v0.1 polish

Label: Launch Polish

## Outcome

Welcome secondary CTA **"See what Receipts will prove"** opens Receipt education — not the generic Connect dock while on the Receipts surface.

## Why this matters

Both CTAs call `setStarted(true)`. Step machine then forces `connect` until `ready`, so the operator lands on Receipts with a dock saying *"Connect otto to your local Letta"* — wrong context and undermines the CTA promise.

## Scope

- Track onboarding **intent path**: `connect` | `receipts-preview`
- Receipts path: show receipt/sample education dock (071) or inline callout; Connect dock only on connect path
- Receipts path may proceed without runtime ready (read-only sample)

## Done when

- [ ] Click secondary CTA → Receipts + receipt-education UI (not connect-only dock)
- [ ] Connect path unchanged for primary CTA
- [ ] Staging smoke covers both CTAs
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
# staging fresh profile: click secondary CTA → screenshot shows receipt education, not connect copy on receipts
```

## Blocker log

Leave blank unless blocked.
