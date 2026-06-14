# practices/

Each subdirectory is one **Practice** — a repeatable, high-value behavior worth preserving
(executable culture). See [`../docs/practices.md`](../docs/practices.md) for the concept and
[`../docs/practice-mining.md`](../docs/practice-mining.md) for how Practices are discovered.

```txt
practices/
  charter/      Evidence-checked operating contracts for autonomous work.
  decision/     Record first-principles decisions and grade their quality later.
  field-note/   Capture messy customer/operator/research notes into durable structured state.
  follow-up/    Draft relationship/customer follow-ups with explicit approval gates.
  review/       Prevent fake done and premature completion by mapping claims to evidence.
```

Each Practice folder holds:

- `practice.yaml` — compact machine-readable spec conforming to `PracticeSpec` in [`packages/core/src/types.ts`](../packages/core/src/types.ts)
- `README.md` — what the Practice is, when it applies, and how to use it
- `templates/` — artifact templates the Practice fills in (where applicable)

## How Practices fit

Practices are the executable layer of otto's culture model — they turn Standards into
repeatable behavior, and Routines bundle them into recurring work:

```txt
Standards   = explicit canon (what we choose)
Practices   = make Standards executable
Routines    = repeat bundles of Practices
Receipts    = prove whether we lived them
```

See also [`../standards/`](../standards) and [`../routines/`](../routines).
