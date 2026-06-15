# Your first Receipt — reading the proof

You sent your first message and otto did some work. otto also wrote a **Receipt** —
*"First turn recorded."* This page explains what that Receipt is and how to read it.

> A Receipt shows what the workspace relied on before it acted — sources, limits, and
> review signature. **It's proof, not chat history.**

## What a Receipt is

A Receipt is a **durable proof record**, written to `~/.otto/receipts/`. It captures
**authority, evidence, and outcome** — *not a log dump.* Each Receipt states who
decided and what changed.

That's the point otto is built around: behavior should leave proof, not just a
conversation. Your chat history shows what was *said*; a Receipt shows what otto
*relied on and did*.

## Three outcomes

A Receipt is written whenever otto **completes, blocks, or fails** an action — each
carries proof. The outcome is one of:

| Outcome | Meaning |
|---|---|
| **success** | otto completed the action. |
| **blocked** | a gate stopped it (the Receipt records the blocker reason). |
| **failed** | the action errored before completing. |

A `blocked` Receipt is not a bug — it's otto proving it stopped where it should, with
the reason recorded.

## How to read one

Open the **Receipts** surface in the app (the onboarding's last step links you
straight there) and select a Receipt. Each one tells you:

- **Action** — what otto did (or attempted).
- **Subject** — what the action was about.
- **Outcome** — success, blocked, or failed (plus the **blocker reason** when blocked).
- **Evidence** — the proof otto relied on; a Receipt with no evidence is making no
  claims.
- **Source** — if the work ran a **Practice** or **Routine**, the Receipt names which
  one.
- **Summary** — a one-line statement of who decided and what changed.

## Where Receipts live

- **In the app:** the **Receipts** surface (left sidebar) — *"Receipts prove what
  happened."* When empty it reads *"No proof yet — send or block a chat turn, ratify a
  proposal, or run a practice, and otto writes a receipt when behavior completes."*
- **On disk:** durable files under `~/.otto/receipts/`. They outlive any single
  session.

## What to do next

1. **Inspect** the Receipt — does the evidence actually support the outcome?
2. **Correct or iterate** — if otto missed something, say so in Chat; the next turn
   produces a fresh Receipt.
3. **Ratify** — when otto proposes a behavior change, accepting it applies canon for
   future runs; rejecting or deferring writes a Receipt without changing behavior.

That loop — *act → prove → correct → ratify* — is how otto turns one good turn into
durable behavior.

## Learn more

- [README](../README.md) — what otto is and the v0.1 Status table
- [`docs/INSTALL.md`](./INSTALL.md) — install steps and where `~/.otto` lives (`OTTO_HOME`)
