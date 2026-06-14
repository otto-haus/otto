# Ship Check — Channels

## Spec promise

Channels are communication surfaces. Discord is v0/v1 backend: mobile and ambient console, not source of truth.

## Required file contract if shipping

- [ ] Channel type exists in core.
- [ ] Channel config exists.
- [ ] Discord docs/templates exist.
- [ ] Approval gate for outbound messages exists.
- [ ] Channel receipts exist.

## Required runtime behavior if shipping

- [ ] Can read/send via channel or explicitly mark scaffold-only.
- [ ] Outbound side effects require approval.
- [ ] Files remain source of truth.

## v0.1 decision

- [ ] Ship only if live/local flow works and approval is enforced.
- [ ] Otherwise Defer and remove demo/ship claims.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
