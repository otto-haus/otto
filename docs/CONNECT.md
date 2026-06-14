# Connecting otto to Letta — troubleshooting the status pill

In the desktop app, **Settings → Connect Letta** shows a status pill that reports
otto's live connection to your local Letta runtime. When it isn't green, this guide
explains what each state means and how to clear it.

> Read the **reason** line first. Every non-ready state shows a short human-readable
> reason next to the pill — otto is telling you exactly what it sees. The fixes below
> are the usual causes. A non-green pill is an honest report, not a crash.

Chat unlocks only once the pill reads **connected** — that is, once the three
required readiness items (Letta runtime, agent identity, memory) are satisfied.

## connected

Everything is wired: the Letta runtime is reachable, your agent is selected, and the
session initialized. Chat is unlocked. Nothing to do.

## needs agent

otto reached Letta but no agent is selected, so it doesn't know who to talk to.

- In **Settings → Connect Letta**, set the **Agent ID** (otto auto-discovers your
  current Letta agent when it can; otherwise enter one).
- Or launch otto with the `OTTO_AGENT_ID` environment variable set (see
  [`docs/INSTALL.md`](./INSTALL.md)).
- Confirm the agent still exists in Letta — if it was deleted, pick or create another.

## auth needed

The runtime is reachable but the model provider has no credentials. **Provider auth
lives in Letta, not otto.**

- Open **Letta Desktop** (or your local Letta runtime) and configure the provider
  credentials / API key for the model your agent uses.
- Once Letta has working provider auth, return to otto and reconnect.

## unreachable

otto can't reach the Letta runtime at all.

- Make sure **Letta Desktop or your local Letta runtime is running.**
- If Letta runs on a non-default address, set `LETTA_BASE_URL` (or the **Letta URL**
  field in Settings → Connect Letta) to point at it.
- Check that nothing (firewall, VPN, wrong port) is blocking the local connection.

## SDK missing

otto couldn't resolve the Letta CLI / SDK it drives the runtime through.

- otto ships a bundled `@letta-ai/letta-code` CLI; if your environment overrides it,
  make sure that path is valid.
- To point at a specific CLI, set `LETTA_CLI_PATH` (see
  [`docs/INSTALL.md`](./INSTALL.md)).
- Reinstalling dependencies (`bun install`) restores the bundled CLI.

## stale session

otto had a session but it went stale — commonly because the Letta runtime restarted
or the connection dropped.

- Click **Retry** in Settings (or in the Chat runtime-not-ready panel) to
  reconnect.
- If Letta itself restarted, give it a moment to come back up, then retry.

## not connected

A general connection error. The **reason** line carries the specifics.

- Read the reason text — it names the underlying failure.
- Click **Retry** to attempt a fresh connection.
- If it persists, confirm Letta is running and reachable, then re-check the more
  specific states above.

## Still stuck?

- Walk the required items in **Settings → Connect Letta** one at a time — each item's
  detail line says what it's waiting for.
- Confirm your environment variables (`OTTO_AGENT_ID`, `LETTA_BASE_URL`,
  `LETTA_CLI_PATH`, `OTTO_HOME`) — see [`docs/INSTALL.md`](./INSTALL.md).
- Open an issue with the pill label and reason text:
  https://github.com/otto-haus/otto/issues

## Learn more

- [README](../README.md) — what otto is and the v0.1 Status table
- [`docs/INSTALL.md`](./INSTALL.md) — install steps and environment variables
