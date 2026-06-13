# Otto

**Otto is the behavior layer for persistent AI agents.**

Letta gives an agent memory.
Otto gives an agent governed future behavior.

It turns operating contracts, practices, routines, standards, approvals, receipts, and
corrections into behavior an agent can repeat, audit, and improve.

> A lesson is not culture until it changes future behavior.

---

## What Otto is

Memory lets an agent *remember*. Otto makes that memory *change what the agent does next*.

Otto is an operating layer on top of a persistent agent runtime (Letta). It encodes the
explicit canon, the repeatable workflows, the approval gates, and the proof trail that let
an agent run long, autonomous work without drifting or faking progress.

```
Letta  = memory / runtime engine
Otto   = the persistent agent + behavior system
```

## Why it exists

Persistent agents accumulate memory, but memory alone doesn't govern behavior. Under
pressure an agent reverts to whatever is easiest — not to what you decided it should do.
Otto makes the intended behavior explicit, ratified, repeatable, and improvable: so
corrections stick, one-way doors stay gated, and "done" means proven.

## Core concepts

| Concept | What it is |
|---|---|
| **Charter** | Operating contracts. Compiles messy intent into a compact contract, runs it with durable file state, and **gates one-way doors (live)**. Designed to prove done with receipts — AC-by-AC auditing is manual in v0.1. |
| **Practices** | Executable Standards — repeatable workflows with a purpose, trigger, inputs, outputs, state, guardrails, evidence standard, and improvement loop. |
| **Routines** | Repeated bundles of Practices. Recurring activation requires approval — attention is a one-way door. |
| **Standards** | The explicit canon: what Otto rewards, refuses, and does under pressure. Precedents are the case law. |
| **Autonomy** | What Otto may own without a human in the loop vs. what must escalate. Ticketcraft compiles bounded worker slices. |
| **Skills** | Reusable capability/context packages an agent loads to do a kind of work. |
| **Approvals** | First-class, scoped, time-bound records of human consent for consequential, one-way actions. |
| **Receipts** | Proof. No artifact, no progress. Done requires mapped proof. |
| **Desktop** | The workspace — reads files as truth and shows active work, runs, approvals, and receipts. |

Substrate: **Files are truth. Memory is lessons. UI is the workspace.**

## Safety model

Otto runs autonomous work *without* removing human authority.

- **Approve doors, not steps.** Reversible work runs freely; consequential one-way actions
  (send/publish, spend, deploy, merge to protected main, force-push, delete, credential or
  permission changes) stop and ask.
- **Approval gates outrank logic.** A Practice or Routine that hits a one-way door blocks
  and records a scoped, time-bound approval under `approvals/`.
- **No fake done.** Two no-evidence loops force a block. Completion requires AC-by-AC proof
  mapping. Standards can block a fake "done" in review.
- **Files = truth.** Active state lives in files, never only in agent memory.

## Install / dev setup

Requires [Bun](https://bun.sh).

```sh
git clone https://github.com/otto-haus/otto
cd otto
bun install

bun run typecheck      # core types
bun test               # unit tests
bun run verify:v0      # core checks + shipped-status pointer
```

Otto Desktop — the workspace (preview):

```sh
bun --cwd apps/desktop run dev      # or: build / typecheck
```

Charter ships as a single-file [Letta Code](https://letta.com) extension plus a skill:

```sh
./scripts/install.sh   # symlinks the extension + installs skills; then run /reload
```

Runtime state lives under `~/.otto` (override with `OTTO_HOME`; `VINNY_HOME` is honored for
backward compatibility — see [Compatibility](#compatibility)).

## Repo map

```
otto/
  packages/
    core/         shared v0 contract — Practice, Routine, Channel, Run, Receipt, Approval, Charter
    practices/    PracticeSpec loader, validator, CLI (otto-practices)
  apps/
    desktop/      Otto Desktop — the workspace (Vite + React, preview)
  extension/      Letta Code commands: charter.ts (Charter + gates), routine.ts
  skill/          agent workflows: SKILL.md (Charter), routine/SKILL.md
  practices/      Practices: charter, decision, review, field-note, follow-up
  routines/       repeated bundles of Practices
  standards/      the explicit canon — standards, precedents, anti-patterns, registry
  templates/      Charter artifacts + Practice/Routine/Standard schemas + worker/ticket packets
  docs/           practices · routines · standards · autonomy · ticketcraft · desktop + architecture
  examples/       a filled example charter
  demo/           Remotion feature demos (demo/out/*.mp4)
  scripts/        install.sh, verify-v0.sh
```

## Shipped feature status

v0.1 is a **local-first, file-backed artifact**, not a runtime. **Nothing is automatically
enforced** — the **Curation** engine that would gate Standards / Approvals / Knowledge is not
built; the `/ticket` compiler and a live Letta runtime are not in v0.1. Charter's permission
**gate is the one live runtime hook**. Full per-surface evidence + cutline:
[`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md) · checks: [`SHIP_CHECKS/`](SHIP_CHECKS/). **Nothing is
Shipped until Sebastian tries it and approves.**

| Feature | Built | Tested | Demo | v0.1 |
|---|:--:|:--:|:--:|:--:|
| Practices | ✅ | ✅ | ✅ | **ship** |
| Skills | ✅ | manual | ✅ | **ship** |
| Charter | ✅ | manual | ✅ | proposed |
| Routines | ✅ | manual | ✅ | proposed |
| Standards | ✅ | manual | ✅ | proposed |
| Desktop | ✅ | build | ✅ | proposed |
| Autonomy | ✅ files | — | ✅ | defer |
| Knowledge | proposed | — | ✅ | defer |
| Approvals · Runs/Receipts · Worker orchestration · Channels | spec/types | — | — | defer |
| Curation | — | — | — | **cut** |

Legend: ✅ = real/automated · `✅ files`/`spec/types` = artifacts exist, no closing runtime · `manual`
manually verifiable · `build` build passes · **v0.1** = ship / proposed (honest preview) / defer
(Built, not Shipped) / cut. **Tried + Approved are Sebastian's — all pending.**

## Compatibility

Renamed from an internal project ("Vinny OS"). For migration, old names are honored where it
is cheap and safe to do so:

- **Env vars:** `OTTO_HOME` is preferred; `VINNY_HOME` still works. `OTTO_ROOT` is
  preferred; `VINNY_OS_ROOT` still works. Default runtime root is `~/.otto`.
- **Feature-scoped env vars** (`CHARTER_HOME`, `ROUTINE_HOME`, `CHARTER_GATES`,
  `ROUTINE_GATES`) are unchanged.

## License

[Apache-2.0](LICENSE).
