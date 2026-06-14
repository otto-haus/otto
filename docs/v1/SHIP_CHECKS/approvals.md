# Ship Check — Approvals

## Spec promise

Approvals are not a peer subsystem. Approval is the human-ratification record Curation emits when a proposal is consequential.

## Required file contract

- [ ] Approval type exists in core.
- [ ] Approval template exists.
- [ ] Fields include scope, requirement, evidence, status, expiration.
- [ ] Status lifecycle exists: pending → approved / denied / expired.

## Required runtime behavior

- [ ] Gate checks approved/unexpired/in-scope before acting.
- [ ] Chat approval alone is insufficient; approval is persisted.
- [ ] Approval records are emitted by Curation or gates.

## Required Desktop surface

- [ ] Pending approvals appear in Curation or appropriate surface.
- [ ] Approve/Deny controls are honest: wired if interactive, disabled/prototype if not.

## Required demo

- [ ] Demo only if approval record flow exists. Otherwise show as deferred/partial.

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
