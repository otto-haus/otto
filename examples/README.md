# Examples

Concrete artifacts that show what otto produces on disk. Files are truth in otto, so the
fastest way to understand a concept is to read a real one.

## `example-charter/`

A frozen snapshot of a **Charter** — one of otto's [core concepts](../README.md#core-concepts):
an operating contract for long-running work, with an objective, acceptance criteria, a plan,
one-way-door gates, and receipts.

This one was written during otto's own v0.1 work — the operating contract for shipping otto
itself — so it doubles as a worked example. Read it as an illustration of the *form*, not a
claim about what's automated today: Charter is an early surface, and this charter's own
[`state.yaml`](example-charter/state.yaml) shows the run still mid-flight (the dogfood step is
open). It is a **static illustration**, not a runnable demo — there is nothing to install or
execute here.

| File | Role |
|---|---|
| [`charter.md`](example-charter/charter.md) | The human face — objective, why now, scope, non-goals, acceptance criteria, gates, plan, stop conditions. What a person reviews and ratifies. |
| [`charter.yaml`](example-charter/charter.yaml) | The machine face — the same contract as structured data, each acceptance criterion carrying its `proof:` receipt path. |
| [`state.yaml`](example-charter/state.yaml) | Live run state — current phase, completed steps, open loops, blockers, and the next action. This is what changes as work proceeds. |
| [`ledger.md`](example-charter/ledger.md) | Append-only history — timestamped entries (`ACTIVATED`, `BUILT`, `REVIEW`, …) with the next step at each point. |
| [`approvals/publish-otto.yaml`](example-charter/approvals/publish-otto.yaml) | A one-way-door approval record — scoped, time-bound human ratification for an irreversible action (here: creating the public repo). |

### How to read it

1. Start with `charter.md` for the intent and the acceptance criteria.
2. Open `charter.yaml` to see how each criterion maps to a `proof:` receipt — *no artifact, no progress*.
3. Skim `state.yaml` and `ledger.md` to see how the run advances over time.
4. Notice `approvals/publish-otto.yaml`: publishing to a public repo is a one-way door, so it
   required a scoped, expiring human approval. otto approves doors, not steps.

For the concepts behind these files, see the [README](../README.md) and
[CONTRIBUTING.md](../CONTRIBUTING.md).
