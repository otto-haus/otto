# Charter Check-in Routine

**Purpose:** prevent long-running work from going stale.

Periodically inspects active Charters, finds ones that have stalled, and recommends
the next step so durable work does not quietly rot between sessions.

## Practices bundled

| Practice | Invocation | Produces |
| --- | --- | --- |
| `charter` | `/charter status` | active Charter summary |
| `review` | `/review stale-charters` | stale goals, missing receipts, unmapped ACs |
| `charter` | `/charter block` | draft blocker record when a blocker needs human input |

## Outputs

- `charter_checkin.md` — active Charter summary, stale goals, blockers, next recommended step
- Run and Receipt records at runtime (local `runs/` and `receipts/`, not committed)

See [`templates/charter-checkin.md`](templates/charter-checkin.md).

## Guardrails

- No external sends. No irreversible actions.
- Recommends the next step; it does not take one-way-door actions.
- Clearly label missing data.

## Autonomy

Vinny may draft and trial. Recurring activation requires human approval.
