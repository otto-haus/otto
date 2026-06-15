# otto Quick Start — your first run

**Goal:** get from a fresh clone to otto connected to your local Letta and your
first live message, in about five minutes.

> The human ratifies. otto records the proof.

otto is the behavior layer for persistent agents. It records what your agent
relied on before it acted — and changes the next run only when you ratify it.

otto is early. **v0.1 is a local-first, file-backed release.** The desktop app and
its surfaces ship; what's *not* yet wired on first launch is your live runtime
connection, which you set up below. Nothing in otto pretends to be more done than it
is — a "not yet" readiness state is honest, not a bug.

---

## 1. Install and launch

Full instructions live in [`docs/INSTALL.md`](./INSTALL.md). The short path:

```sh
git clone https://github.com/otto-haus/otto.git
cd otto
bun install
```

Run the desktop app against your local runtime:

```sh
bun run --cwd apps/desktop electron:dev
```

A packaged desktop install is not the recommended path yet — run from source for now.

**Prerequisite:** otto is a layer *over* Letta. Have **Letta Desktop (or a local
Letta runtime) running** before you connect, with at least one agent available.

---

## 2. The first-run flow

On first launch the desktop app shows a **Welcome** card introducing otto. Click
**Get started →** to begin. otto walks you through four steps, tracked by progress
dots: **welcome → connect → first message → first receipt.**

At the connect step otto asks *"How should otto connect?"* — choose **This Mac** (use
the bundled local Letta) or **Existing Letta install** (point at a Letta you already
run), then **Continue →**. otto tries to **discover Letta and your current agent
automatically**; use **Settings → Connect Letta** only for advanced overrides (a
custom Letta URL or a specific agent). Chat unlocks the moment otto is truly
connected.

The onboarding surface is actively evolving in v0.1, so exact labels may shift — but
the shape is always **welcome → connect → first message → first receipt.**

---

## 3. The readiness gate — why Chat may be locked

This is the single thing most worth understanding on your first run.

> **Live chat unlocks only after otto is truly connected** (`session.initialize()`
> succeeds). Until then the Chat input stays locked **on purpose.**

A locked Chat is otto reporting its real state, not an error. Open
**Settings → Connect Letta** to see the readiness checklist. Three items are
**required** before Chat unlocks:

| Required item | What it means |
|---|---|
| **Letta runtime** | otto's live connection to your local Letta process |
| **Agent identity** | the Letta agent otto will talk to |
| **Memory / MemFS** | otto's local file-backed memory at `~/.otto`; available once the runtime connects |

Everything else is **optional and will not block Chat** — model provider (auth
lives in Letta, not otto), workspace root, Skills, MCP servers, Functions, and otto's
behavior surfaces (Practices, Charters, Standards, Routines, Curation, Receipts,
Autonomy, and more), which ship file-backed and ready to open.

When the three required items report connected, Chat unlocks.

---

## 4. Send your first message — and your first Receipt

1. Open **Chat** (the onboarding's *Go to Chat* takes you there). The ready state
   asks *"What should we work on?"* — type a message, pick a starter, or choose a
   model.
2. Send it. otto relays it to your local agent over Letta and works the turn.
3. otto writes a **Receipt** — proof of what it relied on before it acted (sources,
   limits, review signature). Open the **Receipts** surface to see it; the
   onboarding's final step links you straight there.

That's first success: otto reported its state truthfully, the gate opened, you ran a
live turn, and otto recorded the proof.

---

## What v0.1 is

otto v0.1 is **local-first and file-backed.** Live chat runs over your local Letta,
and otto records a **Receipt** for each completed turn. The behavior surfaces —
Practices, Charters, Standards, Routines, Curation, Receipts, Autonomy, and more —
ship file-backed (the README marks them *"ship (Culture CI demo)"*). You're using
otto at the edge of what's built: it's honest about its state and never pretends a
"not yet" is done, and real operator feedback shapes what becomes standard.

For the authoritative, surface-by-surface status, see the **Status** section of the
[README](../README.md) and [`docs/otto-v01-status.md`](./otto-v01-status.md).

---

## If Chat stays locked

- Confirm **Letta Desktop / your local Letta runtime is running.**
- Confirm an **agent is selected** (Settings → Connect Letta).
- Re-check the readiness checklist — the detail line on each item explains what it's
  waiting for.

---

## Learn more

- [README](../README.md) — what otto is and the v0.1 Status table
- [`docs/INSTALL.md`](./INSTALL.md) — full install + environment variables
- [`docs/desktop.md`](./desktop.md) — the desktop app in depth
- [`docs/otto-v01-status.md`](./otto-v01-status.md) — surface-by-surface v0.1 status
- Found something wrong or confusing? Open an issue:
  https://github.com/otto-haus/otto/issues

otto is local-first and v0.1 — you're using it at the edge of what's built. That's
intentional: real operator feedback shapes what becomes standard.
