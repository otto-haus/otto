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

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `packages/core/src/check.ts` otto.check.v1 + `docs/v1/checks.md`.

### Verification

```sh
bun run verify:v0
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

Evidence: `bun run verify:v0` → **5 passed, 0 failed** (125 unit tests). `bun run --cwd apps/desktop electron:typecheck` → pass.

otto.check.v1 types, docs/v1/checks.md, packages/core check.test.ts, seed YAML — contract solid. Ticket remains in `_Done`.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Spec doc with trigger enum (`done_claim`, `one_way_door_action`): **Pass** — `docs/v1/checks.md` + `packages/core/src/check.ts`
- Core types exported; validator rejects malformed: **Pass** — `validateCheck()` + `check.test.ts`
- Fixture loads from disk: **Pass** — seed YAML under `checks/`
- Falsifiability: **Pass** — inspect rules are concrete booleans, not prose

### Evidence inspected

- Files: `packages/core/src/check.ts`, `packages/core/src/check.test.ts`, `docs/v1/checks.md`
- Commands: `bun run verify:v0` → 5/5 pass

### Finding

Contract is the stable spine for 132–135. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Spec doc + trigger enum: **Pass** — unchanged
- Core types + validator: **Pass**
- Fixture loads from disk: **Pass**
- Falsifiability: **Pass** — staging block proves enforceable failure, not prose
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Commands: `bun test apps/desktop/electron/check-compiler.test.ts check-runner.test.ts check-store.test.ts` → 7/7 pass
- Staging: `staging-rev7-proof-20260614070123.json` — `block.ok: true`, `checkBlockBanner: true`

### Finding

Contract spine validated end-to-end through **133** runtime + **135** staging block. +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Spec doc + trigger enum: **Pass**
- Core types + validator: **Pass**
- Fixture loads from disk: **Pass**
- Falsifiability: **Pass** — staging block + unit runner prove enforceable failure
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- JSON: `staging-rev7-proof-20260614070123.json` — `block.ok: true`, `checkBlockBanner: true`
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- Proof artifacts unchanged; contract files unmodified on current tree vs proof commit `fff0152`.

### Finding

Culture CI spine still falsifiable. +1 stands.

