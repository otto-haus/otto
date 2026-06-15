# Glossary

A quick reference for otto's core vocabulary. Definitions match the
[Core concepts](../README.md#core-concepts) table in the README; this page adds links to the
doc that goes deeper on each. otto is early (v0.1) — where a concept isn't built yet, this says so.

## Core concepts

| Term | Meaning | Learn more |
|---|---|---|
| **Standards** | Explicit canon: what the agent rewards, refuses, and does under pressure. | [standards.md](standards.md) |
| **Practices** | Repeatable behaviors worth preserving. Executable culture. | [practices.md](practices.md) |
| **Routines** | Repeated bundles of Practices. Recurring attention requires approval. | [routines.md](routines.md) |
| **Charters** | Operating contracts for long-running work: objective, acceptance criteria, plan, gates, receipts. | [architecture.md](architecture.md) · [example](../examples/example-charter) |
| **Approvals** | Scoped, time-bound human ratification for one-way doors. | [gates.md](gates.md) |
| **Receipts** | Proof artifacts. No artifact, no progress. | [example-charter](../examples/example-charter) |
| **Curation** | The future engine that decides what compounds into canon. **Not built in v0.1.** | — |
| **otto Desktop** | Workspace over runtime readiness, chat, approvals, receipts, and surfaces. | [desktop.md](desktop.md) |

## Principles

The four primitives otto is built on (see the README [Primitives](../README.md#primitives)):

1. **Reversibility is the unit of trust.** Agents should own reversible work; humans should approve irreversible work. See [autonomy.md](autonomy.md).
2. **Approve doors, not steps.** Don't interrupt for safe intermediate actions — stop at consequential doors. See [gates.md](gates.md).
3. **Receipts over claims.** Done requires proof mapped to the work.
4. **Files are truth. Memory is lessons. UI is workspace.**

## Substrate

- **Letta** — the persistent agent memory and runtime otto runs on. Letta owns canonical agent
  memory; otto owns the culture loop *around* memory (what gets proposed, ratified, repeated, and
  turned into future behavior). otto is **not** a memory engine. See [letta.com](https://letta.com).
- **Gate** — a one-way-door check that forces human approval before an irreversible or
  high-stakes action. See [gates.md](gates.md).
- **Autonomy** — what an agent may do on its own (reversible work) versus what must escalate to a
  human (irreversible doors). See [autonomy.md](autonomy.md).

## Go deeper

- Concepts table and value prop: [README](../README.md#core-concepts)
- Install and run: [docs/INSTALL.md](INSTALL.md)
- System design: [docs/architecture.md](architecture.md)
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
