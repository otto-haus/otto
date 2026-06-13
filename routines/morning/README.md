# Morning Routine

**Purpose:** start the day with situational awareness.

Bundles canonical Practices that answer "what do I need to know before I start?" into
one trigger, producing a daily brief and a receipt.

## Practices bundled

| Practice | Invocation | Produces |
| --- | --- | --- |
| `charter` | `/charter status` | active Charter summary, blockers, pending approvals |
| `review` | `/review brief` | conflicts, missing data, stale receipts, risks |
| `decision` | `/decision frame` | priorities and explicit tradeoffs |
| `follow-up` | `/follow-up draft` | send-gated follow-up drafts |

## Outputs

- `daily_brief.md` — calendar notes, conflicts, priorities, pending approvals, active Charters, suggested next actions
- Run and Receipt records at runtime (local `runs/` and `receipts/`, not committed)

See [`templates/daily-brief.md`](templates/daily-brief.md).

## Guardrails

- No external sends. No irreversible actions.
- No new permissions without approval (for example, calendar access is gated).
- Clearly label missing data instead of guessing.

## Autonomy

Vinny may draft and run a one-off trial. **Recurring 07:00 activation requires human
approval** because a daily brief is a standing claim on attention.
