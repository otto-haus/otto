# Vinny OS

**An open-source operating contract system for autonomous agents.**

> Turn intent into evidence-checked autonomous work.

Vinny OS is an open layer for running long, autonomous agent work safely. Its core is
**Charter**: a system that takes messy human intent, compiles it into a compact
operating contract, runs it autonomously with durable file-based state, gates the
one-way doors behind human approval, and proves it's done with receipts.

```
The human owns charter legitimacy.
The agent owns charter operations.
```

## Why

The human is often not in the weeds enough to write the best goal. The agent has
better local context — repo state, current blockers, prior decisions, tool/runtime
constraints, the real acceptance criteria and implementation path. So the agent
should operationalize vague intent into durable, sharp contracts — while the human
keeps authority over legitimacy and over irreversible actions.

## Object model

```
Intent  ->  Charter  ->  State  ->  Receipt
```

## Charter — the four parts

```
Compiler   messy intent -> compact contract (charter.md + charter.yaml)
Runtime    charter.* / state.yaml / ledger.md / approvals / receipts / traces / notes
Loop       Scout -> Judge -> Worker   (+ Auditor proves done, Recorder keeps files current)
Gates      one-way doors require human approval
```

Substrate: **Files = truth, Memory = lessons, UI = cockpit.** Active state lives in
files (default `~/.charter/charters/`), never in agent memory.

See [`docs/architecture.md`](docs/architecture.md), [`docs/runtime-spec.md`](docs/runtime-spec.md),
and [`docs/gates.md`](docs/gates.md).

## Install (Letta Code)

Charter ships as a single-file [Letta Code](https://letta.com) extension plus a skill.

```sh
git clone https://github.com/seb-veto/vinny-os
cd vinny-os
./scripts/install.sh
```

Then run `/reload` in Letta Code. This:

- symlinks `extension/charter.ts` into `~/.letta/extensions/`
- installs `skill/SKILL.md` into your agent's `skills/charter/`
- scaffolds the runtime under `~/.charter/charters/` (override with `CHARTER_HOME`)

## Commands

```
/charter propose <intent>   compile messy intent into a proposed charter
/charter approve            activate it
/charter status             where / changed / blocked / next / approvals
/charter step               run ONE atomic loop: read state -> slice -> execute/block
                            -> receipt -> update state
/charter receipt <ref>      attach proof (mapped to an acceptance-criterion id)
/charter resume             run steps until a gate or stop condition
/charter complete           Auditor proves done AC-by-AC, then marks complete
```

Also: `update`, `block`, `audit`, `sharpen`, `split`, `cancel`.
`/goal` is a compatibility alias; prefer `/charter`.

## Charter Gates

A permission overlay forces an approval prompt — even in unrestricted mode — before
send/post/publish, spend, deploy, merge to protected main, force-push, delete/destroy,
credential/security changes, and other one-way doors. Approvals are recorded as
scoped, time-bound files under `approvals/`. Disable with `CHARTER_GATES=off`.

## Anti-fake-progress

```
No artifact, no progress.
Two no-evidence loops force block/sharpen.
Done requires AC-by-AC proof mapping.
```

## Layout

```
vinny-os/
  extension/charter.ts     Letta Code command + gates overlay
  skill/SKILL.md           agent workflow
  templates/               charter.md / charter.yaml / state.yaml / ledger.md /
                           approval.yaml / delegation packet
  docs/                    architecture / runtime spec / gates
  examples/                a filled example charter
  scripts/install.sh       install into Letta Code
```

Org-specific doctrine, gates, and templates should live in a separate private repo
so this core stays generic.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
