# Ship Check — Curation

## Implementation status (2026-06-13)

Ship decision: **Ship in v0.1**

- [x] Proposal model + inbox + Accept/Reject/Defer
- [x] Accept ratifies canon (`otto_ratified` guardrail); reject/defer unchanged
- [x] Every decision writes receipt
- [x] Smoke: `otto-014-*`, `otto-015-*`, `otto-016-curation-decisions-smoke-20260613T230000.json`
- [~] Full classification engine partial; consequential flows use autonomy + manual approval

## Spec promise

Curation is the shared proposal-and-ratification engine. It decides what compounds across memory, Charters, Practices, Routines, Channels, Standards, Skills, Knowledge, and external actions.

## Required file contract

- [ ] Central Curation proposal schema exists.
- [ ] Queue location exists.
- [ ] Proposal lifecycle exists.
- [ ] Classification policy exists: risk, reversibility, identity impact, consequence.
- [ ] Ratification policy exists.

## Required runtime behavior

- [ ] Can create a proposal.
- [ ] Can classify a proposal.
- [ ] Safe/reversible proposals can be auto-applied if allowed.
- [ ] Consequential proposals emit Approval records.
- [ ] Standards changes always require Sebastian ratification.

## Required Desktop surface

- [ ] Desktop Curation surface shows pending proposals and approval-required items.

## Required tests

- [ ] Proposal classification test or documented manual flow.

## Required demo

- [ ] Demo only if actual proposal flow exists. Otherwise mark Deferred/Partial.

## Likely v0.1 decision

If central engine is not implemented: Defer or mark Partial. Do not claim shipped.

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
