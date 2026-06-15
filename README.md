# otto

**Your agents forget every correction you give them. otto makes them stick.**

otto is the behavior layer for persistent AI agents. You correct an agent once — *don't call it done without the proof; never cut that corner* — and otto turns the correction into a check it has to pass on every task after. The lesson holds instead of evaporating.

A lesson isn't culture until it changes what happens next. That's the whole job.

**[otto.haus](https://otto.haus) · [Discord](https://discord.gg/hab9ZvbPH) · [Watch the demo](demo/README.md)**

> For the product story, see **[otto.haus](https://otto.haus)**. This README is the clone-and-run path for engineers and contributors.

---

## Direction: otto is becoming a Paperclip plugin

otto is pivoting from a standalone Electron app into an extension of
[Paperclip](https://github.com/paperclipai/paperclip) — the open-source app for running teams of
AI agents. Paperclip is the office; otto is the behavior/culture layer; Letta is the memory/runtime.

- **v1 (in progress): use Letta from Paperclip.** A `letta_local` external **adapter**
  (`packages/paperclip-letta-adapter`) drives an existing local Letta agent from a Paperclip issue,
  preserving memory continuity. Provider keys stay in Letta. Proof target: a **local** Paperclip host
  + an existing **local** Letta runtime on the same Mac.
- **v2: culture updates.** The otto governance loop (corrections → proposals → ratification →
  Standards/Practices → receipts) ships as a Paperclip **plugin** that posts receipts back to issues.
- **v3: the rest, only if it earns its keep.**

The Electron desktop shell (`apps/desktop/`) is **kept as the internal lab / Letta console** — it
validated the local Letta + chat + receipt loop. The adapter is built in a separate package
(`packages/paperclip-letta-adapter`). Archive shell surfaces only **after** the Paperclip adapter has
completed one real issue round-trip — not before.

---

<a id="see-it"></a>

## See it

otto Desktop — a chat workspace with pinned threads, a model selector, and honest runtime connection state.

<p align="center">
  <a href="https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4">
    <img src=".github/assets/otto-desktop.png" alt="otto desktop — chat workspace with pinned threads, model selector, and runtime connection state" width="920" />
  </a>
  <br />
  <a href="https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4">
    <img src="docs/assets/desktop-demo.gif" alt="otto v0.1 desktop walkthrough — Remotion re-enactment of setup, chat, and behavior surfaces" width="820" />
  </a>
</p>

▶ **45-second desktop walkthrough** — a Remotion re-enactment, not a live screen capture ([`demo/README.md`](demo/README.md)).

---

## Quick start

**Default — This Mac (one app).** [Download otto](https://github.com/otto-haus/otto/releases/latest) and open it. otto bundles and supervises its own embedded Letta runtime ([`@letta-ai/letta-code`](https://www.npmjs.com/package/@letta-ai/letta-code), Apache-2.0 — otto is **powered by Letta**), so there's no separate Letta install. Provider keys live in Letta, not otto. See [`docs/v1/embedded-letta-bundle.md`](docs/v1/embedded-letta-bundle.md) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

**Advanced — existing local Letta.** Already running Letta Desktop? Switch to *Existing local Letta* in **Settings → General**. otto won't silently fall back to it — the embedded runtime is the default.

**From source (developers).** You'll need [Bun](https://bun.sh) and [go-task](https://taskfile.dev):

```bash
brew install go-task                 # macOS
git clone https://github.com/otto-haus/otto.git && cd otto
bun install
bun run install-extension            # Letta Code commands → ~/.letta/extensions/
task electron                        # dev app  (task staging for an isolated build)
```

Live chat only unlocks after `session.initialize()` succeeds against a real Letta agent. In This Mac mode that agent comes from the embedded runtime; fix any blockers in **Settings → General**.

---

## Culture CI

Every correction can become a regression test.

Your agent claims "done" with no proof. You correct it once. otto proposes a Check; you ratify it; from then on every "done" has to pass it — acceptance criteria mapped to the work, evidence attached, a receipt written.

```
Pattern:        "done" claimed without evidence
Proposed rule:  completion requires receipts mapped to acceptance criteria
Result:         future "done" claims must attach test output, logs, or artifacts
Gate:           you ratify before it becomes canon
```

Search finds pages. Memory remembers facts. otto changes behavior. Full walkthrough: [`docs/v1/demo-culture-ci.md`](docs/v1/demo-culture-ci.md).

---

## North star

```
correction → proposal → ratification → standard / practice / routine → receipt → better next action
```

If a feature doesn't gate irreversibility or make behavior compound, it probably isn't otto.

**Primitives.** Reversibility is the unit of trust. Approve doors, not steps. Receipts over claims. Files are truth, memory is lessons, the UI is a workspace.

---

## What otto is not

- **Not a memory engine.** Letta owns canonical agent memory; otto owns the culture loop around it.
- **Not an orchestrator.** Work routing is a reference stack (Paperclip), not v0.1 ship.
- **Not a chat app or RAG product.** otto Shell is a workspace for behavior, approvals, and receipts.
- **Not a values poster.** A value that cannot refuse you is decoration.

---

## Core concepts

| Concept | Meaning |
| --- | --- |
| **Standards** | Canon: what the agent rewards, refuses, and does under pressure. |
| **Practices** | Repeatable behaviors worth preserving; executable culture. |
| **Checks** | Executable regressions compiled from ratified Standards — failed Checks write blocked Receipts. |
| **Routines** | Bundles of Practices; recurring activation needs approval. |
| **Charters** | Operating contracts: objective, acceptance criteria, plan, gates, receipts. |
| **Approvals** | Scoped human ratification for one-way doors. |
| **Receipts** | Proof artifacts. No artifact, no progress. |
| **Curation** | The proposal-and-ratification engine (desktop Ship tier; spine still maturing — see [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)). |
| **otto Desktop** | A workspace over runtime readiness, chat, approvals, receipts, and surfaces. |

---

## Status — v0.1.3

Early, local-first, file-backed.

**Ship (Labs off):** chat, settings, desktop shell, Practices, Charters, Standards, Routines, Checks, Receipts, Skills — with honest limits (live chat needs Letta; some surfaces are file-backed or re-enactment demos).

**Labs (Settings → Labs):** Knowledge, Channels, the worker loop, Letta Cloud — not part of public v0.1 claims.

The desktop "done" test: otto Shell launches over Letta and truthfully reports *connected, blocked, stale,* or *ready* — never "connected" unless `session.initialize()` succeeds.

Truth tables: [`docs/v1/ship-tier-matrix.md`](docs/v1/ship-tier-matrix.md) · [`docs/v1/labs.md`](docs/v1/labs.md) · [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) · [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)

---

## Install

**Humans:** start with [`docs/install/getting-started.md`](docs/install/getting-started.md) — paths, Letta prerequisites, and troubleshooting.

**Agents:** [`INSTALL_FOR_AGENTS.md`](INSTALL_FOR_AGENTS.md).

**Quick macOS bootstrap** (clone or use cwd, `bun install`):

```bash
bash scripts/install-otto.sh
# optional: OTTO_INSTALL_EXTENSION=1 bash scripts/install-otto.sh
```

Developers need [Bun](https://bun.sh) and [go-task](https://taskfile.dev). For desktop chat, otto uses an **embedded Letta CLI by default** — you do not need a separate Letta Desktop install unless you choose **Existing Letta** in Settings.

```bash
# macOS
brew install go-task

git clone https://github.com/otto-haus/otto.git
cd otto
bun install
```

**Letta Code extension**

```bash
bun run install-extension
# then run /reload in Letta Code
```

Optional skills (needs an agent memory dir):

```bash
MEMORY_DIR=/path/to/agent/memory bun run install-extension
```

**Desktop launch paths**

```bash
task electron     # dev Electron; preflight + Letta CLI discovery
task staging      # isolated /Applications/otto-staging.app
task staging:main # fetch origin/main then refresh otto-staging.app (#338)
```

Set `OTTO_HOME` or `XDG_STATE_HOME` for clean-profile runs; `LETTA_CLI_PATH` when Letta lives outside the default macOS app path. Update `/Applications/otto.app` only from a published GitHub Release — never from `task refresh` or a local branch build.

**Connect to Letta.** This Mac (default) starts the embedded runtime and bootstraps a local agent — no setup. Existing local Letta (advanced): point otto at your own in **Settings → General**. If it's disconnected, **Settings → General** shows the blocker. Provider credentials stay in Letta.

---

## Verify

```bash
bun run typecheck && bun test && bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task release:gate
OTTO_AGENT_ID=<agent-id> task smoke:cli   # disposable conversation; never the default
bun packages/practices/src/cli.ts         # validate Practices
task docs:dev                             # Mintlify preview (devex/)
```

`task smoke:cli` reports SKIP rather than faking success until a real local agent exists.

---

## Repo map

```
otto/
  packages/       shared contracts + PracticeSpec tooling
  apps/desktop/   otto Desktop: Vite + Electron workspace shell
  extension/      Letta Code commands and permission gates
  skill/          Charter and Routine skills
  practices/      practice.yaml specs
  standards/      canon, precedents, registry
  demo/           Remotion feature demos (re-enactments)
  docs/           architecture, install, runtime, v1 tier truth
  devex/          Mintlify contributor docs
  AGENTS.md       operating notes for AI coding agents
  receipts/       proof artifacts
  SHIP_CHECKS/    per-surface acceptance checks
```

---

## Roadmap

- **Now:** otto Shell over Letta; Practices, Charters, Standards, receipts.
- **Next:** Curation hardening, approval records, a work-state bridge (reference — not v0.1 ship).
- **Then:** intake for AI-chat exports, packaged install.

Each step has to make behavior compound or gate irreversibility.

---

## Community

- Website: <https://otto.haus>
- Discord: <https://discord.gg/hab9ZvbPH>
- GitHub: <https://github.com/otto-haus/otto>

---

## License

[MIT](LICENSE)
