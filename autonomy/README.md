# autonomy/

otto's autonomy policy — what an agent may do on its own versus what must escalate to a human.
The machine policy lives in [`policy.yaml`](policy.yaml) (`otto.autonomy.policy.v1`); the concept
and how it wires into gates are in [`../docs/autonomy.md`](../docs/autonomy.md).

> Otto owns orchestration. Workers own bounded execution. Sebastian owns consequences.
> Own reversible work. Gate consequential work. Approve doors, not steps.

## Zones

| Zone | What it covers | Approval |
|---|---|---|
| **green** — Reversible local work | Act without asking when work is internal and reversible (worktrees, tests/typecheck/retries, drafting specs/docs/receipts, opening PRs while merge still needs approval). | none |
| **yellow** — Prompt once | Operational steps with limited blast radius get a one-time confirm (install deps / run migrations locally, fetch external docs, rebase a worker branch after checks). | confirm once |
| **red** — One-way doors | Consequential actions always require explicit approval before execution. | explicit approval |

## One-way doors (red)

These always require explicit human approval — see [`../docs/gates.md`](../docs/gates.md):

- **send** — Send / post / publish
- **spend** — Spend / charge / transfer
- **deploy** — Deploy / publish live
- **merge** — Merge protected main / force-push
- **delete** — Delete / destroy
- **security** — Credential / security change
- **permission** — Permission expansion
- **recurring** — Recurring routine activation

`policy.yaml` is the source of truth; this README summarizes it.
