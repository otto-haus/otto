# Practice: Charter  ·  `status: active`

**Purpose** — turn rough intent into evidence-checked autonomous work.

Charter is the **flagship Practice** and the one that is fully implemented today. It
compiles messy intent into a compact operating contract, runs a tight loop (pick a
thin slice → execute/block → receipt → update state), gates one-way doors behind human
approval, and proves done AC-by-AC.

> Object model: **Intent → Charter → State → Receipt.**
> The human owns charter legitimacy; the agent owns charter operations.

## Implementation (this Practice is real code)

Charter is **not** just a spec — it ships as a Letta Code extension + skill:

- `extension/charter.ts` — the `/charter` command + `charter-gates` permission overlay
- `skill/SKILL.md` — the agent workflow (Scout / Judge / Worker / Auditor / Recorder)
- `templates/` — `charter.md`, `charter.yaml`, `state.yaml`, `ledger.md`,
  `approval.yaml`, `delegation-packet.md`
- `examples/example-charter/` — a filled example
- `scripts/install.mjs` — installs into Letta Code

This Practice **wraps** those artifacts; it does not duplicate them.

## Invocation

```txt
/charter propose <intent>   compile messy intent into a proposed charter
/charter approve            activate it
/charter status             where / changed / blocked / next / approvals
/charter step               one atomic loop: state -> slice -> execute/block -> receipt -> update
/charter complete           Auditor proves done AC-by-AC, then marks complete
```

Also: `update`, `receipt`, `resume`, `block`, `audit`, `sharpen`, `split`, `cancel`.
`/goal` is a compatibility alias; prefer `/charter`.

## Trigger

- vague intent with a durable objective
- long-running task (> ~30 min)
- work requiring evidence and receipts

## Inputs

- intent · constraints · approval boundaries (which one-way doors need a human)

## Outputs / state

Durable under `$CHARTER_HOME/charters/<slug>/` (default `~/.charter/charters/`,
**outside** Letta memory): `charter.md`, `charter.yaml` (machine source of truth),
`state.yaml`, `ledger.md`, `approvals/`, `receipts/`, `traces/`, `notes/`.

## Guardrails

- **One-way doors require approval** via the `charter-gates` overlay (even in
  unrestricted mode). Approvals persist as scoped, time-bound files under `approvals/`.
- **No artifact, no progress.** Two no-evidence loops force block/sharpen.
- **Done requires AC-by-AC proof mapping.**
- Files are the source of truth, never chat or memory.

## Evidence standard

Done only when every acceptance criterion maps to a real receipt, cleanup + risk notes
are recorded, and user acceptance is captured where required.

## Improvement loop

On completion, write **lessons** (not live state) to memory. Refine templates as
recurring acceptance/gate patterns emerge.

## Docs

[`docs/architecture.md`](../../docs/architecture.md) ·
[`docs/runtime-spec.md`](../../docs/runtime-spec.md) ·
[`docs/gates.md`](../../docs/gates.md)
