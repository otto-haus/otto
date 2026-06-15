<p align="center">
  <a href="#see-it"><img alt="Watch the desktop demo" src="https://img.shields.io/badge/watch-desktop%20demo-14161a?style=for-the-badge" /></a>
  <a href="https://discord.gg/hab9ZvbPH"><img alt="Join Discord" src="https://img.shields.io/badge/Discord-join%20otto-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>
  <a href="https://otto.haus"><img alt="otto.haus" src="https://img.shields.io/badge/otto.haus-visit-2f855a?style=for-the-badge" /></a>
</p>

# otto

**Define the culture your AI agents run on.**

Letta remembers. otto improves.

otto is the behavior layer for persistent AI agents — Standards, Practices, Checks,
Routines, approvals, and receipts that turn corrections into better future behavior.

> A lesson is not culture until it changes what happens next.

For the product story, visit [otto.haus](https://otto.haus). This README is the clone-and-run path for engineers and contributors.

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

The Electron desktop shell (`apps/desktop/`) is **kept as the internal lab / Letta cockpit** — it
validated the local Letta + chat + receipt loop. The adapter is built in a separate package
(`packages/paperclip-letta-adapter`). Archive shell surfaces only **after** the Paperclip adapter has
completed one real issue round-trip — not before.

---

<a id="see-it"></a>

## See it

<p align="center">
  <a href="https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4">
    <img src=".github/assets/otto-desktop.png" alt="otto desktop — chat workspace with pinned threads, model selector, and runtime connection state" width="920" />
  </a>
  <br />
  <a href="https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4">
    <img src="docs/assets/desktop-demo.gif" alt="otto desktop walkthrough preview" width="820" />
  </a>
  <br />
  <sub>
    <em>
      <a href="https://github.com/otto-haus/otto/releases/latest/download/otto-v01-desktop.mp4">▶&nbsp;45s desktop walkthrough</a>
      · Remotion re-enactment, not a live screen capture —
      <a href="demo/README.md">demo/README.md</a>
      · Hero cut <code>OttoProductDemo</code> in
      <a href="https://github.com/otto-haus/otto/pull/525">PR&nbsp;#525</a>
      (full render: <a href="https://github.com/otto-haus/otto/issues/577">#577</a>)
    </em>
  </sub>
</p>

---

## Quick start

**Agents:** [`INSTALL_FOR_AGENTS.md`](INSTALL_FOR_AGENTS.md) · [`AGENTS.md`](AGENTS.md)

**Default — This Mac (one app):** download otto and it works. otto bundles and supervises its
own embedded [Letta](https://letta.com) runtime ([`@letta-ai/letta-code`](https://www.npmjs.com/package/@letta-ai/letta-code),
Apache-2.0; otto is **powered by Letta**), so no separate Letta install is required. Provider keys
live in Letta, not otto. See [`docs/v1/embedded-letta-bundle.md`](docs/v1/embedded-letta-bundle.md)
and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

**Advanced — Existing local Letta:** if you already run Letta Desktop, switch to **Existing local
Letta** in **Settings → General**. otto will not silently fall back to it; the embedded runtime is the default.

**From source (developers)** need [Bun](https://bun.sh) and [go-task](https://taskfile.dev):

```sh
brew install go-task          # macOS
git clone https://github.com/otto-haus/otto.git && cd otto
bun install
bun run install-extension     # Letta Code commands → ~/.letta/extensions/
task electron                 # dev app (or task staging for isolated /Applications/otto-staging.app)
```

Live chat unlocks only after `session.initialize()` succeeds against a real Letta agent. In This Mac
mode that agent comes from the embedded runtime; fix any blockers in **Settings → General**. See
[Install](#install) for extension skills, smoke checks, and canonical app boundaries.

---

## Culture CI

Every correction can become a regression test.

You correct an agent once (“done” without proof). otto proposes a Check. You ratify it.
Future “done” claims must pass — mapped acceptance criteria, attached evidence, receipt.

```txt
Pattern:        “done” claimed without evidence
Proposed rule:  completion requires receipts mapped to acceptance criteria
Result:         future done claims must attach test output, logs, or artifacts
Gate:           human ratifies before it becomes canon
```

Walkthrough: [`docs/v1/demo-culture-ci.md`](docs/v1/demo-culture-ci.md). Search finds pages. Memory remembers facts. otto changes behavior.

---

## North star

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

If a feature does not gate irreversibility or make behavior compound, it is probably not otto.

**Primitives:** (1) Reversibility is the unit of trust. (2) Approve doors, not steps. (3) Receipts over claims. (4) Files are truth. Memory is lessons. UI is workspace.

---

## What otto is not

- **Not a memory engine** — Letta owns canonical agent memory; otto owns the culture loop.
- **Not an orchestrator** — work routing is a reference stack (Paperclip), not v0.1 ship.
- **Not a chat app or RAG product** — otto Shell is a workspace for behavior, approvals, and receipts.
- **Not a values poster** — a value that cannot refuse you is decoration.

---

## Core concepts

| Concept | Meaning |
|---|---|
| **Standards** | Canon: what the agent rewards, refuses, and does under pressure. |
| **Practices** | Repeatable behaviors worth preserving; executable culture. |
| **Checks** | Executable regressions from ratified Standards — failed Checks write blocked Receipts. |
| **Routines** | Bundles of Practices; recurring activation requires approval. |
| **Charters** | Operating contracts: objective, ACs, plan, gates, receipts. |
| **Approvals** | Scoped human ratification for one-way doors. |
| **Receipts** | Proof artifacts. No artifact, no progress. |
| **Curation** | Proposal-and-ratification engine (desktop Ship tier; spine still maturing — see [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)). |
| **otto Desktop** | Workspace over runtime readiness, chat, approvals, receipts, and surfaces. |

---

## Status (v0.1)

Early, local-first, file-backed. **Ship** (Labs off): chat, settings, desktop shell, Practices, Charters, Standards, Routines, Checks, Receipts, Skills — with honest limits (live chat needs Letta; some surfaces are file-backed or re-enactment demos).

**Labs** (Settings → Labs): Knowledge, Channels, worker loop, Letta Cloud — not public v0.1 claims.

Truth tables: [`docs/v1/ship-tier-matrix.md`](docs/v1/ship-tier-matrix.md) · [`docs/v1/labs.md`](docs/v1/labs.md) · [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) · [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md)

**Desktop done test:** otto Shell launches over Letta and truthfully reports connected, blocked, stale, or ready — never “connected” unless `session.initialize()` succeeds.

Issues: GitHub Issues with exactly one `p0`–`p3` label — [`docs/github-issues-workflow.md`](docs/github-issues-workflow.md).

---

## Install

### Letta Code extension

```sh
bun run install-extension
# then run /reload in Letta Code
```

Optional skills (needs agent memory dir):

```sh
MEMORY_DIR=/path/to/agent/memory bun run install-extension
```

### Desktop launch paths

```sh
task electron     # dev Electron; preflight + Letta CLI discovery
task staging      # isolated /Applications/otto-staging.app
```

Set `OTTO_HOME` or `XDG_STATE_HOME` for clean-profile runs. `LETTA_CLI_PATH` when Letta is outside the default macOS app path.

**Canonical app:** update `/Applications/otto.app` only from a published GitHub Release — not from `task refresh` or local branch builds.

### Connect to Letta

1. Launch via `task electron`, `task staging`, or the Release build at `/Applications/otto.app`.
2. **This Mac (default):** otto starts its embedded Letta runtime and bootstraps a local agent — no setup.
3. **Existing local Letta (advanced):** switch in **Settings → General** to point otto at a Letta you already run.
4. If disconnected, **Settings → General** shows the blocker. Provider credentials stay in Letta.

### Verify

```sh
bun run typecheck && bun test && bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
task release:gate
OTTO_AGENT_ID=<agent-id> task smoke:cli   # disposable conversation; never default
bun packages/practices/src/cli.ts           # validate Practices
task docs:dev                               # Mintlify preview (devex/)
```

`task smoke:cli` is optional until a real local agent exists; it reports `SKIP` instead of faking success.

---

## Repo map

```txt
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

- **Now:** otto Shell over Letta, Practices, Charters, Standards, receipts.
- **Next:** Curation hardening, approval records, work-state bridge (reference — not v0.1 ship).
- **Then:** Intake for AI-chat exports, packaged install.

Each step must make behavior compound or gate irreversibility.

---

## Community

- Website: <https://otto.haus>
- Discord: <https://discord.gg/hab9ZvbPH>
- GitHub: <https://github.com/otto-haus/otto>

---

## License

[MIT](LICENSE)
