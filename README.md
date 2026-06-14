<p align="center">
  <a href="#desktop-demo"><img alt="Watch the desktop demo" src="https://img.shields.io/badge/watch-v0.1%20desktop%20demo-14161a?style=for-the-badge" /></a>
  <a href="https://discord.gg/hab9ZvbPH"><img alt="Join Discord" src="https://img.shields.io/badge/Discord-join%20otto-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>
  <a href="https://otto.haus"><img alt="otto.haus" src="https://img.shields.io/badge/otto.haus-visit-2f855a?style=for-the-badge" /></a>
</p>

# otto

**Define the culture your AI agents run on.**

<a id="desktop-demo"></a>

https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4

Letta remembers. otto improves.

otto is the behavior layer for persistent AI agents.

Memory is what an agent knows. Culture is what it reliably does under pressure. otto turns
Standards, Practices, Routines, approvals, receipts, and corrections into better future
behavior.

> A lesson is not culture until it changes what happens next.

---

## What this looks like

Without otto, an agent can remember a correction and still repeat the same mistake.

Example: the agent says “done” without proof. You correct it.

With otto, that correction should become a proposal:

```txt
Pattern:        “done” claimed without evidence
Proposed rule:  completion requires receipts mapped to acceptance criteria
Result:         future done claims must attach test output, logs, or artifacts
Gate:           human ratifies before it becomes canon
```

Once ratified, the correction becomes a Standard, Practice, or receipt requirement.
The next run changes.

Search finds pages. Memory remembers facts. otto changes behavior.

---

## North star

otto exists to make agent behavior compound.

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If a feature does not gate irreversibility or make behavior compound, it is probably not
otto.

---

## Primitives

1. **Reversibility is the unit of trust.** Agents should own reversible work. Humans should
   approve irreversible work.
2. **Approve doors, not steps.** The system should not interrupt for safe intermediate
   actions. It should stop at consequential doors.
3. **Receipts over claims.** Done requires proof mapped to the work.
4. **Files are truth. Memory is lessons. UI is workspace.**

---

## What otto is not

- **Not a memory engine.** Letta owns canonical agent memory. otto owns the culture loop
  around memory: what gets proposed, ratified, rejected, repeated, and turned into future
  behavior.
- **Not an orchestrator.** Paperclip can own work orchestration. otto owns behavior
  governance.
- **Not a chat app or RAG product.** otto Shell is a workspace for behavior, approvals,
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
| **otto Desktop** | Workspace over runtime readiness, chat, approvals, receipts, and surfaces. |

---

## Reference operating stack

This is the first otto deployment stack, not the definition of otto:

```txt
Letta remembers.      Persistent agent memory and runtime continuity.
otto improves.        Standards, Practices, Curation, Routines, Receipts.
Paperclip manages.    Goals, tickets, budgets, heartbeats, approvals, audit.
Discord reaches.      Mobile blockers, approvals, field notes, status.
```

otto should survive replacement of any substrate except its own behavior layer.

---

## Status

otto is early. v0.1 is a local-first, file-backed release artifact.

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
| Desktop | ship |
| Approvals / Runs / Receipts | defer |
| Autonomy / Tickets / Workers | defer |
| Channels | defer |
| Curation | cut |

The first falsifiable desktop done test:

> otto Shell launches over Letta and truthfully reports its own state — connected,
> blocked, stale, or ready. Live chat unlocks only after `session.initialize()` succeeds.

---

## Roadmap

- **Now:** otto Shell over Letta, Practices, Charters, Standards, receipts.
- **Next:** Curation, approval records, Long-Run Practice, Paperclip work-state bridge.
- **Then:** Intake for AI-chat exports, source-corpus hooks, relationship-state hooks, packaged install.

The roadmap only matters if each step makes behavior compound or gates irreversibility.

---

## Install

Agents: start with [`INSTALL_FOR_AGENTS.md`](INSTALL_FOR_AGENTS.md).

Humans need [Bun](https://bun.sh), [go-task](https://taskfile.dev) for the `task` shortcuts, and [Letta Desktop / Letta Code](https://letta.com) for the local runtime.

```sh
# macOS
brew install go-task

git clone https://github.com/otto-haus/otto.git
cd otto
bun install
```

Install the Letta Code extension and skills:

```sh
bun run install-extension
# then run /reload in Letta Code
```

This installs Charter/Routine commands, skills, and one-way-door permission gates.

Local desktop app:

```sh
# development Electron app
task electron

# build, package, install to /Applications/otto.app, and open
task refresh
```

Connect the desktop app to Letta:

A fresh clone does not include a hosted agent. Live chat requires a local Letta runtime, provider auth configured in Letta, and a target Letta agent.

1. Open `/Applications/otto.app`.
2. otto tries to discover Letta Desktop and your current local agent automatically.
3. Use **Settings → General** only for advanced runtime/agent overrides.
4. Provider/model credentials stay in Letta. otto does not ask for provider API keys in v1.

Useful checks:

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task release:gate
task smoke:cli   # disposable conversation; never writes to default
```

DevEx docs:

```sh
task docs:dev       # Mintlify preview for devex/
task docs:validate  # Mintlify validation, also run by task ci
task docs:links     # Mintlify internal link check
```

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

## otto Desktop

Common commands:

```sh
task dev          # Vite web preview; no desktop bridge
task electron     # Electron app wired to local Letta
task refresh      # build/package/install/open /Applications/otto.app
task ps           # show otto + spawned Letta CLI processes
```

Package scripts:

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop electron:build
```

Runtime truth:

- `OTTO_AGENT_ID` selects the target Letta agent.
- `~/.otto` stores local otto runtime/config/traces.
- `LETTA_CLI_PATH` may point at a specific Letta CLI bundle.
- Chat stays gated until `session.initialize()` succeeds.

Do not claim “connected” unless the SDK initializes against a live agent/session.

---

## Repo map

```txt
otto/
  packages/       shared contracts + PracticeSpec tooling
  apps/desktop/   otto Desktop: Vite + Electron workspace shell
  extension/      Letta Code commands and permission gates
  skill/          Charter and Routine skills
  practices/      practice.yaml specs
  routines/       proposed Routine specs
  standards/      canon, precedents, anti-patterns, registry
  autonomy/       policy.yaml: zones, doors, action classification
  templates/      Charter, Practice, Routine, Standard, Ticket, Worker packets
  docs/           architecture, install, runtime, autonomy, desktop, practices, routines
  devex/          Mintlify docs for contributor workflow and local gates
  AGENTS.md       operating notes for AI coding agents
  INSTALL_FOR_AGENTS.md  agent-first install protocol
  receipts/       proof artifacts for v0.1
  SHIP_CHECKS/    per-surface acceptance checks
```


---

## Community

- Website: <https://otto.haus>
- Discord: <https://discord.gg/hab9ZvbPH>
- GitHub: <https://github.com/otto-haus/otto>

---

## License

[MIT](LICENSE)
