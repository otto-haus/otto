<p align="center">
  <img src=".github/assets/otto-avatar.png" width="144" alt="Otto" />
</p>

# Otto

**Letta remembers. Otto improves.**

Otto is the behavior layer for persistent AI agents.

Memory is what an agent knows. Culture is what it reliably does under pressure. Otto turns
Standards, Practices, Routines, approvals, receipts, and corrections into better future
behavior.

> A lesson is not culture until it changes what happens next.

---

## What this looks like

Without Otto, an agent can remember a correction and still repeat the same mistake.

Example: the agent says “done” without proof. You correct it.

With Otto, that correction should become a proposal:

```txt
Pattern:        “done” claimed without evidence
Proposed rule:  completion requires receipts mapped to acceptance criteria
Result:         future done claims must attach test output, logs, or artifacts
Gate:           human ratifies before it becomes canon
```

Once ratified, the correction becomes a Standard, Practice, or receipt requirement.
The next run changes.

Search finds pages. Memory remembers facts. Otto changes behavior.

---

## North star

Otto exists to make agent behavior compound.

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If a feature does not gate irreversibility or make behavior compound, it is probably not
Otto.

---

## Primitives

1. **Reversibility is the unit of trust.** Agents should own reversible work. Humans should
   approve irreversible work.
2. **Approve doors, not steps.** The system should not interrupt for safe intermediate
   actions. It should stop at consequential doors.
3. **Receipts over claims.** Done requires proof mapped to the work.
4. **Files are truth. Memory is lessons. UI is workspace.**

---

## What Otto is not

- **Not a memory engine.** Letta owns canonical agent memory. Otto owns the culture loop
  around memory: what gets proposed, ratified, rejected, repeated, and turned into future
  behavior.
- **Not an orchestrator.** Paperclip can own work orchestration. Otto owns behavior
  governance.
- **Not a chat app or RAG product.** Otto Shell is a workspace for behavior, approvals,
  receipts, and work state.
- **Not a values poster.** A value that cannot refuse you is decoration.

---

## Core concepts

| Concept | Meaning |
|---|---|
| **Standards** | Explicit canon: what the agent rewards, refuses, and does under pressure. |
| **Practices** | Repeatable behaviors worth preserving. Executable culture. |
| **Routines** | Repeated bundles of Practices. Recurring attention requires approval. |
| **Charters** | Operating contracts for long-running work: objective, ACs, plan, gates, receipts. |
| **Approvals** | Scoped, time-bound human ratification for one-way doors. |
| **Receipts** | Proof artifacts. No artifact, no progress. |
| **Curation** | The future engine that decides what compounds into canon. Not built in v0.1. |
| **Otto Desktop** | Workspace over runtime readiness, chat, approvals, receipts, and surfaces. |

---

## Reference operating stack

This is the first Otto deployment stack, not the definition of Otto:

```txt
Letta remembers.      Persistent agent memory and runtime continuity.
Otto improves.        Standards, Practices, Curation, Routines, Receipts.
Paperclip manages.    Goals, tickets, budgets, heartbeats, approvals, audit.
Discord reaches.      Mobile blockers, approvals, field notes, status.
```

Otto should survive replacement of any substrate except its own behavior layer.

---

## Status

Otto is early. v0.1 is a local-first, file-backed release artifact.

Source of truth:

- [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)
- [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)
- [`SHIP_CHECKS/`](SHIP_CHECKS/)

| Surface | v0.1 decision |
|---|---|
| Namespace | ship |
| Practices | ship |
| Skills | ship |
| Charter | proposed |
| Routines | proposed |
| Standards | proposed |
| Desktop | proposed |
| Approvals / Runs / Receipts | defer |
| Autonomy / Tickets / Workers | defer |
| Channels | defer |
| Curation | cut |

The first falsifiable desktop done test:

> Otto Shell launches over Letta and truthfully reports its own state — connected,
> blocked, stale, or ready. No fake live chat.

---

## Roadmap

- **Now:** Otto Shell over Letta, Practices, Charters, Standards, receipts.
- **Next:** Curation, approval records, Long-Run Practice, Paperclip work-state bridge.
- **Then:** Intake for AI-chat exports, source-corpus hooks, relationship-state hooks, packaged install.

The roadmap only matters if each step makes behavior compound or gates irreversibility.

---

## Install

Agents: start with [`INSTALL_FOR_AGENTS.md`](INSTALL_FOR_AGENTS.md).

Humans: requires [Bun](https://bun.sh).

```sh
git clone https://github.com/otto-haus/otto
cd otto
bun install
```

Install the Letta Code extension and skills:

```sh
./scripts/install.sh
# then run /reload in Letta Code
```

This installs Charter/Routine commands, skills, and one-way-door permission gates.

---

## Verify

```sh
bun run typecheck
bun test
bun run verify:v0
```

Validate Practices:

```sh
bun packages/practices/src/cli.ts
```

---

## Otto Desktop

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
- Chat stays gated until `session.initialize()` succeeds.

Do not claim “connected” unless the SDK initializes against a live agent/session.

---

---

## Repo map

```txt
otto/
  packages/       shared contracts + PracticeSpec tooling
  apps/desktop/   Otto Desktop: Vite + Electron workspace shell
  extension/      Letta Code commands and permission gates
  skill/          Charter and Routine skills
  practices/      practice.yaml specs
  routines/       proposed Routine specs
  standards/      canon, precedents, anti-patterns, registry
  templates/      Charter, Practice, Routine, Standard, Ticket, Worker packets
  docs/           architecture, install, runtime, autonomy, desktop, practices, routines
  AGENTS.md       operating notes for AI coding agents
  INSTALL_FOR_AGENTS.md  agent-first install protocol
  receipts/       proof artifacts for v0.1
  SHIP_CHECKS/    per-surface acceptance checks
```

---

## License

[MIT](LICENSE)
