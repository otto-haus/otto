# Otto

**Letta remembers. Otto improves.**

Otto is the behavior layer for persistent AI agents: Standards, Practices, Routines,
approvals, receipts, and corrections that make future behavior better.

Memory is what an agent knows. Culture is what it reliably does under pressure. Otto is
the layer that makes the second one real.

I built Otto because I wanted it for my own agents. Running it convinced me the pattern
should be public: a clean, honest layer for turning agent corrections into compounding
behavior is worth more shared than hoarded.

---

## The thesis

Most agent systems optimize capability: smarter models, longer runs, more tools.

Otto optimizes **compounding behavior**.

The two primitives:

1. **Reversibility is the unit of trust.** Own reversible work. Gate irreversible work.
2. **A lesson is not culture until it changes future behavior.** Memory that does not
   change what happens next is a trophy, not a lesson.

Everything in Otto exists to run that loop:

```txt
correction -> proposal -> ratification -> practice/standard/routine -> receipt -> better next action
```

---

## What Otto is not

- **Not a memory engine.** That is Letta. Otto does not own canonical agent memory. Otto owns the culture loop around memory: what gets proposed, ratified, written back, rejected, repeated, and turned into future behavior.
- **Not an orchestrator.** That is Paperclip. Otto governs how work should be done.
- **Not a chat app or RAG product.** Otto Shell is a workspace for behavior, receipts,
  approvals, and work state.
- **Not a values poster.** A value that cannot refuse you is decoration.
- **Not a replacement for human judgment.** Otto removes low-value step approvals; it
  preserves consequential door approvals.

The substrates are replaceable. The behavior layer is the point.

---

## Core doctrine

```txt
Own reversible work.
Gate consequential work.
Approve doors, not steps.
Receipts over claims.
Files are truth. Memory is lessons. UI is workspace.
One is better than two — when one can be true.
```

### Reversible work

Agents should own reversible/internal work:

- read files
- draft docs
- edit local branches
- run tests
- create receipts
- propose standards/practices
- prepare task packets

### One-way doors

Humans approve consequential work:

- send or publish
- spend money
- deploy
- merge protected branches
- force-push
- delete important state
- change credentials or security posture
- make customer/company/legal commitments

### Done

A task is not done because an agent says it is done.

Done means:

1. acceptance criteria are known,
2. work was performed,
3. receipts exist,
4. gaps are disclosed,
5. consequential done is accepted by the relevant human.

---

## Core concepts

| Concept | Meaning |
|---|---|
| **Standards** | The explicit canon: what the agent rewards, refuses, and does under pressure. |
| **Practices** | Repeatable behaviors worth preserving. Executable culture. |
| **Routines** | Repeated bundles of Practices. Recurring attention requires approval. |
| **Charters** | Operating contracts for long-running work: objective, ACs, plan, gates, receipts. |
| **Approvals** | Scoped, time-bound human ratification for one-way doors. |
| **Receipts** | Proof artifacts. No artifact, no progress. |
| **Runs** | Execution records for Practices, Routines, and Charters. |
| **Curation** | The future engine that decides what compounds into canon. Not built in v0.1. |
| **Otto Desktop** | Workspace over runtime readiness, chat, approvals, receipts, and surfaces. |

Authority model:

```txt
Human -> Core Principles -> Standards -> Curation -> Practices / Routines / Charters / Memory
```

The human owns consequences. Paperclip can own work orchestration. Otto owns behavior governance. Workers own bounded execution. Authority flows down; proposals flow up.

---

## Reference operating stack

This is the first Otto deployment stack, not the definition of Otto. Otto should survive replacement of any substrate except its own behavior layer.

Otto is one layer in a local-first agent system:

```txt
Letta remembers.        Persistent agent memory and runtime continuity.
Otto improves.          Standards, Practices, Curation, Routines, Receipts.
Paperclip manages.      Goals, tickets, budgets, heartbeats, approvals, audit.
Discord reaches you.    Mobile blockers, approvals, field notes, status.
Source corpora cite.    Retrieval with passages, provenance, gaps, limitations.
CRM tracks people.      Relationships, roles, trust state, next asks.
```

Otto does not absorb those layers. It makes their outputs change future behavior.

---

## Status

Otto is early. v0.1 is a local-first, file-backed release artifact.

The standard is strict: a feature is **Shipped** only when built, tested or truthfully
marked, demoed, tried by the release owner, approved, and released.

Source of truth:

- [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)
- [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)
- [`SHIP_CHECKS/`](SHIP_CHECKS/)

| Surface | Status | v0.1 decision |
|---|---|---|
| Namespace | complete | ship |
| Practices | loader, validator, CLI, tests | ship |
| Skills | Charter + Routine skills/install | ship |
| Charter | contract + Letta Code gate hook; manual Auditor | proposed |
| Routines | specs + approval gate; scheduler deferred | proposed |
| Standards | canon + precedents; enforcement manual | proposed |
| Desktop | Electron shell + web preview; Letta bridge path implemented; live chat gated | proposed |
| Approvals | core type + examples; no Curation engine | defer |
| Runs/Receipts | types + receipts; no run engine | defer |
| Autonomy/Tickets/Workers | specs/templates only | defer |
| Channels | deferred | defer |
| Curation | not built | cut |

The first falsifiable desktop done test is small:

> Otto Shell launches over Letta and truthfully reports its own state — connected,
> blocked, stale, or ready. No fake live chat.

---

## Quick start

Requires [Bun](https://bun.sh).

```sh
git clone https://github.com/otto-haus/otto
cd otto
bun install

bun run typecheck
bun test
bun run verify:v0
```

Validate Practices:

```sh
bun packages/practices/src/cli.ts
```

Expected shape:

```txt
slug        status  result
----------  ------  ------
charter     active  ok
decision    draft   ok
field-note  draft   ok
follow-up   draft   ok
review      draft   ok
```

---

## Otto Desktop

The canonical desktop app lives in [`apps/desktop`](apps/desktop).

It has two modes:

1. **Web preview** — Vite workspace shell.
2. **Electron shell** — local desktop bridge with Letta SDK wiring.

```sh
bun run --cwd apps/desktop dev
bun run --cwd apps/desktop build
bun run --cwd apps/desktop typecheck

bun run --cwd apps/desktop electron:dev
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop electron:build
```

Runtime truth:

- `OTTO_AGENT_ID` selects the target Letta agent.
- `~/.otto` stores local Otto runtime/config/traces.
- `LETTA_CLI_PATH` may point at a specific Letta CLI bundle.
- MemFS is off by default for the local backend.
- Chat stays gated until `session.initialize()` succeeds.
- Stale conversation/session errors should be diagnosed, not hidden.

Do not claim “connected” unless the SDK initializes against a live agent/session.

---

## Letta Code extension + skills

Install the local extension and skills into Letta Code:

```sh
./scripts/install.sh
# then run /reload in Letta Code
```

This installs:

- `/charter` and `/goal` compatibility command
- Charter gates for one-way-door permission checks
- `/routine` command
- Routine gates for recurring activation
- Charter/Routine skills

---

## Repo map

```txt
otto/
  packages/
    core/          shared v0 contract types
    practices/     PracticeSpec loader, validator, CLI
  apps/
    desktop/       Otto Desktop: Vite + Electron workspace shell
  extension/       Letta Code commands and permission gates
  skill/           Charter and Routine skills
  practices/       practice.yaml specs
  routines/        proposed Routine specs
  standards/       canon, precedents, anti-patterns, registry
  templates/       Charter, Practice, Routine, Standard, Ticket, Worker packets
  docs/            architecture, runtime, autonomy, desktop, practices, routines
  demo/            Remotion feature demos
  receipts/        proof artifacts for v0.1
  SHIP_CHECKS/     per-surface acceptance checks
  scripts/         install + verification scripts
```

---

## Public identity

Current local target identity:

- Product: **Otto**
- GitHub target: `otto-haus/otto`
- Package scope: `@otto-haus/`
- Domain: `otto.haus`
- Future dream domain: `ot.to`

This namespace is prepared locally but must be confirmed before any push, tag, package
publish, or release.

Historical note: Otto was renamed from an internal project called “Vinny OS.” Backward
compatibility env vars (`VINNY_HOME`, `VINNY_OS_ROOT`) may remain where cheap and safe.

---

## License

[Apache-2.0](LICENSE)
