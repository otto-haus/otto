# Routines — repeated bundles of Practices

> Routines make Practices compound.
> Otto may propose them. The human legitimizes recurring activation.

## Why this exists

Long-term memory is only valuable if it changes future behavior. Otto turns
repeated combinations of Practices into **Routines** — not cron jobs, reminders, or
automations.

```txt
Practices = executable culture.
Routines  = repeated bundles of Practices.
```

A Routine exists **only if it changes behavior or improves judgment over time.** If it
adds noise without useful artifacts, it gets paused, merged, or retired.

## The layer model

"Routine" is the product concept. Schedule is only the mechanism.

```txt
Routine   = repeated bundle of Practices   (the product concept)
Schedule  = cron / RRULE / event trigger   (the backend mechanism)
Run       = one execution record
Receipt   = proof from a Run
```

- A **Practice** is what gets done well (`/charter status`, `/review receipts`).
- A **Routine** chooses which Practices run together, in what order, and why.
- A **schedule** may trigger the Routine, but it does not define the product.
- A **Run** records one execution and yields Receipts or a block.

See the shared contract: [`architecture/v0-contract.md`](architecture/v0-contract.md).

## Product model

```txt
Otto
  Practices
    Charter · Decision · Review · Field Note · Follow-up
  Routines
    Morning
    Weekly Culture
    Charter Check-in
    Practice Mining
```

## Definition

A Routine is a durable bundle with:

- **steps** — ordered canonical Practice invocations
- **schedule** — optional cron/RRULE mechanism; absent means on-demand
- **attention cost** — honest accounting of the claim it makes on the human
- **activation approval** — required for any recurring/standing Routine
- **runs and receipts** — runtime proof, stored outside git as local records

## Spec format

Each Routine carries a compact, machine-readable `routine.yaml` that conforms to the
`Routine` type in [`packages/core/src/types.ts`](../packages/core/src/types.ts). The
canonical template is [`routines/_templates/routine.yaml`](../routines/_templates/routine.yaml).

Every `steps[].practice` must be one of the canonical Practice slugs:

```txt
charter | decision | review | field-note | follow-up
```

## Layout

```txt
routines/
  _templates/          routine.yaml / run.yaml / receipt.md
  morning/             routine.yaml + README.md + templates/
  weekly-culture/      routine.yaml + README.md + templates/
  charter-checkin/     routine.yaml + README.md + templates/
  practice-mining/     routine.yaml + README.md + templates/
```

Runtime `runs/` and `receipts/` are intentionally gitignored. Files remain truth; UI is
a workspace over those files.

## Autonomy boundary

```txt
Routine proposal       can be autonomous.
One-off low-risk trial can be autonomous.
Recurring activation   belongs to the human.   ← attention is a one-way door
Permissions / effects  belong to the human.
```

The contract invariant is explicit: activating a recurring Routine spends the human's
finite attention and requires the human's nod.

See also: [`routine-mining.md`](routine-mining.md) · [`practices.md`](practices.md) ·
[`autonomy.md`](autonomy.md) · [`desktop.md`](desktop.md).
