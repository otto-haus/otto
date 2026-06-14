# ADR 093 — Multi-Agent Workspace Policy

**Status:** proposed  
**Ticket:** **093**  
**Deciders:** product + architecture  
**Related:** **076**, **092**, **093**, `otto-v1-surface-contracts.md`

---

## Context

Letta supports multiple agents. Otto’s north star is **one compounding behavior loop** — correction → proposal → ratification → receipt → better next action. Splitting agents too early creates context debt: duplicated preferences, divergent standards, unclear ownership, and “which agent knows this?” friction.

Sebastian’s operating rule: **one agent until a second is literally needed.**

---

## Decision

1. **Default:** one **primary otto agent** per workspace.
2. **Architecture:** may support N Letta agents (advanced / isolation paths).
3. **Product UI:** do **not** center a fleet. No multi-agent team dashboard in v1.
4. **Second+ agent:** only via **Advanced → Create isolated agent** with explicit boundary reason.

---

## When a second agent is justified

Allow only when there is a **real boundary**:

| Boundary | Example |
|----------|---------|
| Different human owner | Shared machine, separate operators |
| Different authority level | Read-only auditor vs implementer |
| Different secrets/tools | Finance tools vs code repo tools |
| Different schedule/channel | Separate cron / Discord reachability |
| Different long-running mission | Research agent vs shipping agent |
| Strong isolation need | “Finance agent cannot touch code” |

If the boundary is weak (“I want a fresh chat”), use **threads** (**046**) or new **conversation** under the **same** agent — not a new agent.

---

## UI rules

- Onboarding: create/select **one** otto agent; no “add agent” on first run (**080**).
- Settings: primary agent shown prominently; secondary agents hidden under **Advanced**.
- No agent picker in Chat header by default.
- Each agent gets isolated: `agentId`, autonomy profile reference, optional separate `OTTO_HOME` subtree (advanced only — **120**).

---

## Letta Cloud

Multiple cloud agents are technically fine. Otto workspace maps **1:1 to primary agent** unless advanced flow creates an isolated secondary with receipt + boundary record.

---

## Consequences

- **076** bootstraps one default agent.
- **119** enforces primary-agent UX in Settings/onboarding.
- **120** (parked) implements advanced second agent when unparked.
- **115** pilot pricing: “one persistent agent workspace” aligns with this policy.
- **093** blocks v1 tickets that imply fleet UI without explicit unpark.

---

## Rejected alternatives

- **Agent fleet as default** — optimizes for demos, destroys compounding culture.
- **Hard limit of one agent forever** — blocks legitimate isolation (finance/code).
- **Per-agent Standards without isolation** — worst of both worlds (split canon).

---

## Done test

> A new user completes onboarding with exactly one primary agent, never sees a fleet dashboard, and can only add a second agent through Advanced with a documented boundary — or not at all in v1 until **120** ships.
