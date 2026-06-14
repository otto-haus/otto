# templates/

Blank, copy-me scaffolds for the artifacts otto produces. Copy one out, fill it in, and put it
where it belongs (a charter folder, `standards/standards/`, a ticket, etc.). Grouped by what they
seed:

## Charter

| Template | Seeds |
|---|---|
| `charter.md` | The human-facing Charter contract — objective, scope, acceptance criteria, gates, plan. |
| `charter.yaml` | The machine Charter contract — source of truth for AC ids, gates, plan ids, status. |
| `state.yaml` | Mutable run state for a charter (phase, completed steps, blockers, next action). |
| `ledger.md` | Append-only, timestamped Charter history. |

See [`../docs/architecture.md`](../docs/architecture.md) for the Charter runtime.

## Practices & Routines

| Template | Seeds |
|---|---|
| `practice.yaml` | The canonical Practice spec schema. |
| `practice-proposal.md` | A proposal for a new Practice. |
| `routine-proposal.md` | A proposal for a new Routine. |

See [`../docs/practices.md`](../docs/practices.md) and [`../docs/routines.md`](../docs/routines.md).

## Standards

| Template | Seeds |
|---|---|
| `standard.yaml` | A Standard spec (copy into `standards/standards/<slug>`). |
| `standard-precedent.md` | A Standards precedent — case law for how a Standard was applied. |
| `standard-receipt.md` | A Standards receipt — proof a Standard was lived. |

See [`../docs/standards.md`](../docs/standards.md) and [`../standards/`](../standards).

## Approvals & autonomy

| Template | Seeds |
|---|---|
| `approval.yaml` | A scoped, time-bound approval record for a one-way door. |
| `autonomy-receipt.md` | An autonomy receipt. |

See [`../docs/gates.md`](../docs/gates.md) and [`../docs/autonomy.md`](../docs/autonomy.md).

## Work execution

| Template | Seeds |
|---|---|
| `ticket.yaml` | The machine source of truth for one bounded execution slice. |
| `worker-packet.md` | A worker packet — the brief handed to a worker for a ticket. |
| `delegation-packet.md` | A delegation packet for handing a task off. |

See [`../docs/ticketcraft.md`](../docs/ticketcraft.md).
