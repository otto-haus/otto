# Weekly Culture Routine

**Purpose:** improve decision quality and culture.

A weekly reflection that turns the week's decisions, receipts, field notes, and
workflows into graded learning and proposed improvements to Practices and Routines.

## Practices bundled

| Practice | Invocation | Produces |
| --- | --- | --- |
| `decision` | `/decision review` | graded decisions and lessons |
| `review` | `/review receipts` | recurring failure patterns, missed receipts |
| `field-note` | `/field-note summarize` | operator/customer notes worth preserving |
| `review` | `/review routines` | Routine usefulness review + proposed changes |

## Outputs

- `culture_notes.md` — graded decisions, recurring patterns, proposed updates
- Run and Receipt records at runtime (local `runs/` and `receipts/`, not committed)

See [`templates/culture-notes.md`](templates/culture-notes.md).

## Guardrails

- No external sends. No irreversible actions.
- Proposals only — activation of any new or changed Practice/Routine is the human's call.
- Clearly label missing data.

## Self-audit rule

The Routine usefulness review audits this Routine too. If the weekly review stops
producing acted-on changes, flag it for pruning so the auditor never becomes rote
ceremony.
