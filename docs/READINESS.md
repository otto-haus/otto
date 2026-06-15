# otto Readiness — understanding the setup checklist

When you open **Settings → Connect Letta** in the desktop app, otto shows a
**readiness checklist**: each part of your setup and whether it's ready. This page
explains every item in plain language — what it is, whether it's required, and how
to resolve it.

> Readiness is real. It's generated from your actual local state
> (`apps/desktop/scripts/gen-readiness.mjs`), not a mock. A "not yet" status is an
> honest report, **not a bug.**

## The gate

Three items are **required**. otto keeps **Chat gated until they're satisfied** —
the desktop done-test is *"Live chat unlocks only after `session.initialize()`
succeeds."* Everything else is **optional** and never blocks Chat.

## Status vocabulary

Each item reports one of five honest statuses:

| Status | Meaning |
|---|---|
| **connected** | Live and wired to your local runtime. |
| **configured** | Set up and detected. |
| **file** | Backed by a file on disk. |
| **missing** | Not present yet. |
| **not-wired** | Waiting on a live runtime connection. |

In the web preview nothing is wired to a runtime, so the required runtime items
honestly read **not-wired** / **missing**. In the desktop app connected to Letta,
they move to **connected**.

## Required — Chat unlocks once these are satisfied

| Item | What it is | How to resolve |
|---|---|---|
| **Letta runtime** | otto's live connection to your local Letta process. | Run Letta Desktop (or a local Letta runtime) and connect in Settings → Connect Letta. |
| **Agent identity** | The Letta agent otto talks to. | Select the agent in Settings → Connect Letta. |
| **Memory / MemFS** | otto's file-backed memory, rooted at `~/.otto`. | Becomes available automatically once the runtime connects. |

## Optional — useful, but never blocks Chat

These configure or extend your agent; none of them gate Chat:

| Item | What it is | How to resolve |
|---|---|---|
| **Model provider** | The LLM provider for your agent. Provider auth lives in **Letta, not otto.** | Configure providers in Letta Desktop / your local Letta runtime. |
| **Workspace root** | The otto project root otto operates over (the repo is auto-detected). | Override with the `OTTO_HOME` environment variable. |
| **Skills** | Skill definitions (`SKILL.md`) otto can install into a live agent. | Install into a live agent via `scripts/install.sh`. |
| **MCP servers** | Model Context Protocol servers available to your agent. | Add `mcpServers` in `~/.otto/config.json`. |
| **Functions** | Local tools registered for your agent. | Register functions in `~/.otto/config.json`. |
| **Labs** | The master toggle for experimental Labs surfaces. | Toggle in Settings → Labs. |

### Behavior surfaces

otto's behavior surfaces — **Charters, Standards, Practices, Routines, Curation,
Receipts, Autonomy, Knowledge, Tickets, Channels** — are file-backed and ready in
v0.1. Each appears as its own optional readiness item, and each resolves the same
way: **open that surface in the desktop app.** They never block Chat. The
**Permissions / autonomy** policy (the three-zone green / yellow / red model) is
visible in the Autonomy surface; see [`docs/autonomy.md`](./autonomy.md). A separate
runtime permission modal ships independently.

## Why otto gates this

otto's first job is to **report its own state truthfully** — connected, blocked,
stale, or ready. Gating Chat on the three required items means otto never pretends
to be connected when it isn't, and never lets you message an agent that isn't really
there. The checklist turns "why isn't this working?" into "here's exactly what's
left."

## Learn more

- [README](../README.md) — what otto is and the v0.1 Status table
- [`docs/INSTALL.md`](./INSTALL.md) — install steps and environment variables (incl. `OTTO_HOME`)
- [`docs/autonomy.md`](./autonomy.md) — the three-zone autonomy policy behind the Permissions item
