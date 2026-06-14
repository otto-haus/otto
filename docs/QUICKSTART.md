# otto Quick Start — your first run

**Goal:** get from a fresh clone to otto connected to your local Letta and your
first live message, in about five minutes.

> The human ratifies. otto records the proof.

otto is the behavior layer for persistent agents. It records what your agent
relied on before it acted — and changes the next run only when you ratify it.

otto is early. **v0.1 is a local-first, file-backed release.** The desktop app
ships; some surfaces are intentionally deferred (see [What's not here yet](#whats-not-here-yet)).
Nothing in otto pretends to be more done than it is — a "not yet" state is honest,
not a bug.

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

On first launch the desktop app shows a **Welcome** card:

- **Connect local Letta →** — start connecting (recommended)
- **See what Receipts will prove** — a preview of a feature that isn't shipped yet
- **Skip** — dismiss; you can connect later from Settings

After you start, a small **"Getting started"** dock appears in the bottom-left and
tracks your progress through *connect* and then *run your first message*.

otto tries to **discover Letta Desktop and your current local agent
automatically.** You only need Settings for advanced overrides (a custom Letta URL
or a specific agent). The onboarding surface is still evolving in v0.1, so exact
labels may shift — the flow is always **welcome → connect → first message.**

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
lives in Letta, not otto), workspace root, Skills, Practices, MCP servers,
Functions, and the autonomy/permissions policy. Several of these read **"coming
soon"** in v0.1; that's expected.

When the three required items report connected, Chat unlocks.

---

## 4. Send your first message

1. From the dock, choose **Go to Chat** (or open the **Chat** surface).
2. Type a message and send it.
3. otto relays it to your local agent over Letta.

That's first success: otto reported its state truthfully, the gate opened, and
you're in a live session over your local Letta.

---

## What's not here yet

otto is honest about its edges. In v0.1, these are **deferred** and will not appear
as finished features:

- **Receipts, Runs, and Approvals.** The "See what Receipts will prove" button is a
  preview. No Receipt artifact is created at runtime in v0.1 — as the onboarding
  dock says, *"Your first Receipt will appear here once Receipts land."*
- **Practices** are not loaded in the v0.1 desktop yet.
- **Curation** is not built in v0.1.

For the authoritative surface-by-surface status, see the **Status** section of the
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
- [`docs/otto-v01-status.md`](./otto-v01-status.md) — what ships, what's deferred
- Found something wrong or confusing? Open an issue:
  https://github.com/otto-haus/otto/issues

otto is local-first and v0.1 — you're using it at the edge of what's built. That's
intentional: real operator feedback shapes what becomes standard.
