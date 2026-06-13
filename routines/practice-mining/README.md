# Practice Mining Routine

**Purpose:** let Otto discover repeated workflows.

Scans recent Runs and receipts for behaviors happening more than once, then drafts
Practice/Routine proposals so executable culture grows from real work instead of
guesswork.

## Practices bundled

| Practice | Invocation | Produces |
| --- | --- | --- |
| `review` | `/review runs` | repeated behaviors, repeated blockers, missing receipts |
| `field-note` | `/field-note capture` | observations worth preserving as proposal evidence |
| `review` | `/review proposals` | merge/deprecate/activate recommendations |

## Outputs

- `practice_proposals.md` — candidate Practice/Routine proposals and merge/deprecate recommendations
- proposal drafts using [`../../templates/routine-proposal.md`](../../templates/routine-proposal.md) or [`../../templates/practice-proposal.md`](../../templates/practice-proposal.md)
- Run and Receipt records at runtime (local `runs/` and `receipts/`, not committed)

## Guardrails

- **Proposals only** — never auto-activate a Practice or Routine.
- No external sends. No irreversible actions. No new permissions.
- Clearly label missing data.

## Autonomy

Otto may draft and trial this Routine and may write proposal files. Activating any
mined Practice/Routine — and activating this Routine on a recurring schedule — requires
human approval.
