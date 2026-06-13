# Routine Mining

Routines are not only authored top-down — they are **mined** from repeated bundles of
Practices. Vinny owns the mining loop; the human legitimizes recurring activation.

```txt
Observe repeated need
→ compose Practices into a Routine
→ check the autonomy boundary
→ draft Routine + run a low-risk one-off trial
→ write receipt
→ propose recurring activation
→ measure usefulness
→ refine, pause, or retire
```

## The loop in detail

1. **Observe** — notice a recurring need where canonical Practices keep firing
   together, or where a standing check would prevent drift.
2. **Compose** — choose ordered `steps[]` using canonical Practice slugs only
   (`charter`, `decision`, `review`, `field-note`, `follow-up`).
3. **Check the boundary** — internal + reversible + no new permissions + no external
   effects may be drafted and trialed. Anything beyond that asks first.
4. **Draft + trial** — write `routine.yaml` as `status: proposed` or `trial`; run one
   low-risk trial if useful. Nothing recurring is enabled.
5. **Propose activation** — surface a proposal using
   [`templates/routine-proposal.md`](../templates/routine-proposal.md). Recurring
   activation is the human's call because it is a standing claim on attention.
6. **Measure** — review useful outputs, user edits required, blocked runs, and whether
   the human would miss the Routine if it vanished.
7. **Refine / pause / retire** — improve the bundle, merge overlaps, or stop it.

## Who does what

```txt
Vinny      owns Routine operations  (observe, compose, draft, trial, measure, recommend).
The human  owns Routine legitimacy  (approve recurring activation, behavior changes, side effects).
```

## Deprecate, pause, or merge a Routine when it is

- not changing behavior
- not producing useful artifacts or Receipts
- repeatedly requiring user correction
- overlapping another Routine
- rarely surfacing anything the human acts on

A Routine must earn attention. If the user would not miss it if it vanished, prune or
redesign it. Apply the same test to review/mining Routines so the auditor never becomes
rote ceremony.

See the contract invariant in [`architecture/v0-contract.md`](architecture/v0-contract.md):
**attention is a one-way door.**
