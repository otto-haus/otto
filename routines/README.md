# routines/

Each subdirectory is one **Routine** — a repeated bundle of canonical Practices.
See [`../docs/routines.md`](../docs/routines.md) for the concept and
[`../docs/routine-mining.md`](../docs/routine-mining.md) for how Routines are discovered.

```txt
routines/
  _templates/          blank routine.yaml / run.yaml / receipt.md
  morning/             situational awareness to start the day
  weekly-culture/      decision quality + culture review
  charter-checkin/     keep long-running Charter work from going stale
  practice-mining/     discover repeated workflows
```

Each Routine folder holds:

- `routine.yaml` — compact machine-readable spec conforming to `Routine` in [`packages/core/src/types.ts`](../packages/core/src/types.ts)
- `README.md` — purpose, bundled Practices, outputs, guardrails
- `templates/` — artifact templates the Routine fills in

## Where runs and receipts live

Routines are specs. Executions are durable **Runs** and produce **Receipts**. Runtime
records belong in local `runs/` and `receipts/` directories, which are gitignored.

```txt
Routine file = product truth
Letta cron   = execution backend
Desktop      = cockpit
```

## Status lifecycle

```txt
proposed → trial → active → paused → retired
```

Vinny may draft and trial low-risk Routines autonomously. **Recurring activation is
the human's call** — a standing Routine spends attention, and attention is a one-way
door. See [`../docs/architecture/v0-contract.md`](../docs/architecture/v0-contract.md).
