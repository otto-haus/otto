# Vinny OS

**An open-source system for turning repeated agent workflows into executable culture.**

> Practices are executable culture.

Vinny OS runs long, autonomous agent work safely by turning repeated high-value
behaviors into **Practices** — deliberate workflows with a purpose, trigger, inputs,
outputs, durable state, guardrails, an evidence standard, and an improvement loop.
Slash commands are just the invocation layer. The Practice is the workflow behind it.

```
Culture    = lived outcome (what the system does under pressure).
Standards  = explicit canon (what we reward, refuse, and do under pressure).
Practices  = executable Standards.
```

The flagship Practice, **Charter**, is fully implemented today: it takes messy human
intent, compiles it into a compact operating contract, runs it autonomously with
durable file-based state, gates the one-way doors behind human approval, and proves
it's done with receipts.

```
The human owns legitimacy.
The agent owns operations.
```

## The layer model

```
Practice       cultural / workflow ritual   (the product concept)
Slash command  technical shortcut           (the invocation mechanism)
Tool           action primitive             (the capability used)
State          files / memory               (the durable record)
```

Internal docs may still say "slash command." Product language says **Practice**.
See [`docs/practices.md`](docs/practices.md).

## Standards

**Standards** are the explicit operating canon — what Vinny OS rewards, refuses, and does
under pressure. Culture is the lived outcome; Standards are the deliberate choice we grade
it against. A Practice exists only if it reinforces a Standard.

```
Sebastian → Standards → Curation → Practices / Routines / Charters / Channels / Memory
```

Sebastian ratifies Standards; Curation enforces them downstream and may propose changes
but never ratifies them; Standards changes never auto-apply. Standards stay **contextual**
(in Charter proposals, Reviews, Receipts, Curation cards, Routine audits), not a
dashboard. When two Standards collide, we write a **Precedent** — the case law. v0 set:
Quality / No Fake Done · Judgment · Candor + Kindness · Respect Attention · First-Principles
Reasoning · Winning / Outcomes Over Motion. See
[`standards/`](standards/) and [`docs/standards.md`](docs/standards.md).

## Practices

| Practice | Status | Purpose | Invoke |
|----------|--------|---------|--------|
| **Charter**   | `active` | Turn intent into evidence-checked autonomous work | `/charter` |
| **Decision**  | `draft`  | Record first-principles decisions and grade them later | `/decision` |
| **Review**    | `draft`  | Prevent fake done by mapping claims to evidence | `/review` |
| **Field Note**| `draft`  | Capture messy customer/operator notes into durable state | `/field-note` |
| **Follow-up** | `draft`  | Draft relationship follow-ups behind an approval gate | `/follow-up` |

Each Practice lives in [`practices/<slug>/`](practices/) with a compact `practice.yaml`
spec, a `README.md`, and artifact `templates/`. Charter is real code (extension +
skill); the other four are draft specs that reuse Charter's primitives.

---

## Charter — the flagship Practice

> Object model: **Intent → Charter → State → Receipt.**

```
Compiler   messy intent -> compact contract (charter.md + charter.yaml)
Runtime    charter.* / state.yaml / ledger.md / approvals / receipts / traces / notes
Loop       Scout -> Judge -> Worker   (+ Auditor proves done, Recorder keeps files current)
Gates      one-way doors require human approval
```

Substrate: **Files = truth, Memory = lessons, UI = cockpit.** Active state lives in
files (default `~/.charter/charters/`), never in agent memory. See
[`docs/architecture.md`](docs/architecture.md),
[`docs/runtime-spec.md`](docs/runtime-spec.md), and [`docs/gates.md`](docs/gates.md).

### Install (Letta Code)

Charter ships as a single-file [Letta Code](https://letta.com) extension plus a skill.

```sh
git clone https://github.com/TryVeto/vinny-os
cd vinny-os
./scripts/install.sh
```

Then run `/reload` in Letta Code. This:

- symlinks `extension/charter.ts` into `~/.letta/extensions/`
- installs `skill/SKILL.md` into your agent's `skills/charter/`
- scaffolds the runtime under `~/.charter/charters/` (override with `CHARTER_HOME`)

### Commands

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

### Charter Gates

A permission overlay forces an approval prompt — even in unrestricted mode — before
send/post/publish, spend, deploy, merge to protected main, force-push, delete/destroy,
credential/security changes, and other one-way doors. Approvals are recorded as
scoped, time-bound files under `approvals/`. Disable with `CHARTER_GATES=off`.

### Anti-fake-progress

```
No artifact, no progress.
Two no-evidence loops force block/sharpen.
Done requires AC-by-AC proof mapping.
```

---

## Practice Mining

Practices can be mined from repeated work: observe a recurring behavior → propose a
Practice → human approves → activate → measure → refine or deprecate. Proposals use
[`templates/practice-proposal.md`](templates/practice-proposal.md). See
[`docs/practice-mining.md`](docs/practice-mining.md).

## Safety & autonomy

Practices **cannot** bypass human approval. Every `practice.yaml` carries an
`approval_required_for` floor (enabling globally, external side effects, permission
expansion); communication Practices add a hard no-send gate. Approval gates outrank
Practice logic — a Practice that hits a one-way door stops and asks. See
[`docs/autonomy.md`](docs/autonomy.md).

## Desktop

Vinny OS Desktop is a cockpit over Practices: active Practices, invocations, recent
runs, pending proposals, metrics, and approval controls. See
[`docs/desktop.md`](docs/desktop.md).

## Layout

```
vinny-os/
  standards/               the explicit canon
    registry.yaml          index of Standards + conflict map (case law)
    standards/             the v0 Standards (one file each)
    canon/ precedents/ anti-patterns/ evaluations/
  practices/               the Practices
    charter/               practice.yaml + README   (wraps the extension/skill below)
    decision/ review/ field-note/ follow-up/        practice.yaml + README + templates
  extension/charter.ts     Charter: Letta Code command + gates overlay
  skill/SKILL.md           Charter: agent workflow
  templates/               Charter artifact templates + practice.yaml / standard schema
                           + proposal / precedent / receipt fragments
  docs/                    standards / practices / mining / autonomy / desktop / metrics
                           + architecture / runtime-spec / gates (Charter)
  examples/                a filled example charter
  scripts/install.sh       install into Letta Code
```

Org-specific doctrine, gates, and templates should live in a separate private repo so
this core stays generic.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
