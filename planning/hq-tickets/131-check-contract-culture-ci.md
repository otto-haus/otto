# 131 — Check Contract (Culture CI wedge)

Owner: Codex
Priority: P0
Depends on: 008, 009, 016
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

Ratified culture can compile into **executable behavioral regressions** — not docs, not vibes.

Introduce the **Check** primitive:

```txt
Ratified rule → executable Check → future behavior blocked or allowed → Receipt
```

A check is a versioned, inspectable artifact with a stable YAML/JSON shape stored under `~/.otto/checks/` (or repo `checks/` for canon seeds).

## Why this matters (category)

Thesis today: *Letta remembers. Otto improves.*

Skeptic question: *How do I know it improved?*

Answer after this ticket:

```txt
Because yesterday’s correction became today’s failing test.
```

Category positioning:

```txt
Letta = memory
Paperclip = management
Otto = behavior CI (say in prose — not a UI label)
```

A Standard that does not execute is a values poster. A Receipt that does not become a regression is archaeology.

## Scope

- **Spec doc:** `docs/v1/checks.md` — trigger / inspect / on_fail semantics, versioning, provenance
- **Core types:** `packages/core/src/types.ts` (or dedicated `check.ts`) — `Check`, `CheckTrigger`, `CheckInspect`, `CheckOnFail`; schema id **`otto.check.v1`**
- **Canonical example** (from product brief):

```yaml
id: completion-requires-receipts
source: standard/no-fake-done.md
trigger:
  event: done_claim
inspect:
  require:
    - acceptance_criteria_mapped
    - evidence_attached
    - test_or_log_or_artifact_present
on_fail:
  block_claim: true
  message: "Not done: missing mapped proof."
  write_receipt: true
```

- **Validator** + unit tests for schema (invalid checks rejected at load)
- **Relationship to 051:** 051 is ticket/charter lifecycle gate; **Checks** are the general product primitive that can enforce 051 rules and more
- **Naming:** **Checks** in UI/code; category positioning in README/marketing as CI-for-behavior prose (see plan **Category and naming (locked)**)

## Non-goals

- Runtime execution (**133**)
- Compiler from Standard (**132**)
- UI surfaces (**134**)
- Cloud-synced check registry

## Done when

- [ ] Spec doc merged with trigger event enum (minimum: `done_claim`, `one_way_door_action`)
- [ ] Core types exported; validator rejects malformed fixtures
- [ ] At least one fixture check loads from disk in a unit test
- [ ] Reviewer +1 on falsifiability: “what would fail if culture did not compound?”

## Verification

```sh
cd /Users/seb/Code/otto
bun run typecheck
bun test packages/core
```

## Blocker log

Leave blank unless blocked.
