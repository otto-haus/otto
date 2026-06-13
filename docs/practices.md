# Practices — the product concept

> Practices are executable culture.
> Vinny mines them. The human legitimizes them. Vinny OS makes them repeatable.

## Why this exists

World-class execution is built through repeated high-value behaviors under pressure.
Vinny OS turns those behaviors into **Practices** — not one-off prompts, not a pile of
"slash commands," not "automations."

```txt
Culture    = shared practices.
Practices  = executable culture.
```

A Practice exists **only if it helps repeat an important behavior better.** If it adds
ceremony without raising quality, it gets merged or deprecated.

## The layer model

"Practice" is the product concept. The other words are mechanics underneath it.

```txt
Practice       = cultural / workflow ritual   (the product concept)
Slash command  = technical shortcut           (the invocation mechanism)
Tool           = action primitive             (the capability used)
State          = files / memory               (the durable record)
```

- A **Practice** is what a person chooses to do ("run a Charter", "record a Decision").
- A **slash command** is how they trigger it (`/charter propose ...`).
- A **tool** is what the Practice calls to act (write file, send message, search).
- **State** is what persists after (`charters/<slug>/`, receipts, ledger, memory).

Internal/technical docs may still say "slash command." Product- and user-facing
language says **Practice**.

### Naming

Use `Practices`. Not `Plugins`, `Modes`, `Automations`, or "Slash commands" (that is
the invocation layer, not the concept).

## Product model

```txt
Vinny OS
  Practices
    Charter      (active — fully implemented)
    Decision     (draft)
    Review       (draft)
    Field Note   (draft)
    Follow-up    (draft)
  Slash commands        (invocation only)
    /charter  /decision  /review  /field-note  /follow-up
```

## Definition

A Practice is a durable workflow with:

- **purpose** — the repeated behavior it improves
- **trigger** — when Vinny recommends or invokes it
- **inputs** — what the user/environment must provide
- **outputs** — artifacts, decisions, drafts, receipts, state updates
- **state** — where durable records live (`state_paths`)
- **guardrails** — what it must not do, or must ask before doing
- **evidence standard** — what counts as successful completion
- **improvement loop** — how it gets refined or deprecated after use
- **metrics** — usage and quality signals

## When NOT to use a Practice

- one-off edits · simple explanations · short questions
- exploratory work with no repeatable cultural value
- anything where ceremony would cost more than the quality it buys

## Spec format

Each Practice carries a compact, machine-readable `practice.yaml`. The canonical
schema (with field docs) is in [`templates/practice.yaml`](../templates/practice.yaml).
Keep the spec compact — put rationale, examples, and templates in the Practice's
`README.md` and `templates/`.

## Layout

```txt
practices/
  charter/      practice.yaml + README.md   (wraps extension/skill/templates)
  decision/     practice.yaml + README.md + templates/
  review/       practice.yaml + README.md + templates/
  field-note/   practice.yaml + README.md + templates/
  follow-up/    practice.yaml + README.md + templates/
```

## Relationship to Charter

**Charter** is the flagship, fully-implemented Practice (a Letta Code extension +
skill). The other four are **draft specs** that reuse Charter's primitives:

- Charter's **Auditor / anti-fake-progress** → the **Review** Practice.
- Charter's **one-way-door gates** → the no-send gate in **Follow-up** / **Field Note**.
- First-principles + grading doctrine → the **Decision** Practice.

See also: [`practice-mining.md`](practice-mining.md) · [`autonomy.md`](autonomy.md) ·
[`desktop.md`](desktop.md) · [`metrics.md`](metrics.md).
