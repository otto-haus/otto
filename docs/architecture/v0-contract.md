# Otto — v0 shared contract

This is the **foundation layer**. It fixes the shared meaning of the core objects so
that parallel lanes (practices/core, routines, channels, desktop) build against the
same primitives and meanings don't drift.

Source of truth for types: [`packages/core/src/types.ts`](../../packages/core/src/types.ts).
This doc explains the model and the invariants those types encode.

```
Status: v0 (draft contract). Changing a primitive here is a legitimacy change.
```

## Locked naming (2026-06-13)

```txt
Charter   = operating contracts
Practices = executable culture
Routines  = repeated bundles of Practices
Channels  = where Otto reaches you
Runs      = execution records
Receipts  = proof
```

Supporting terms: **Otto** = the persistent agent and behavior system (one identity, many functions);
**Otto Desktop** = the workspace; **Letta** = memory/runtime substrate.

## Object model

```txt
Intent   -> Charter -> State -> Receipt        (the Charter Practice)
Practice -> Run     -> Receipt                  (any Practice)
Routine  -> [Practice...] -> [Run...]           (a bundle)
Run      -> Channel                             (delivery)
Gate     -> Approval                            (one-way doors)
```

- A **Practice** is the product concept: a deliberate, repeatable workflow with a
  purpose, trigger, inputs, outputs, state, guardrails, evidence standard, and
  improvement loop. A **slash command** is only its invocation mechanism.
- A **Run** is one execution of a Practice. It yields **Receipts** (proof) or a block.
- A **Routine** bundles Practices into a repeated sequence; schedules/cron are the
  mechanism, Routines are the product language.
- A **Channel** is where Otto reaches the human. Outbound is an external side effect.
- An **Approval** is a first-class, scoped, time-bound record of human consent for a
  one-way door.

## The primitives

| Object | Purpose | Key fields | Type |
|--------|---------|-----------|------|
| `PracticeSpec` | the workflow contract (mirrors `practice.yaml`) | `slug`, `status`, `invocations`, `state_paths`, `guardrails`, `evidence_standard`, `approval_required_for` | core/types |
| `PracticeMetrics` | usage + quality signals (durable state) | `uses`, `successful_runs`, `blocked_runs`, `premature_done_prevented` | core/types |
| `Routine` | repeated bundle of Practices | `steps`, `schedule?`, `attention_cost`, `requires_approval_to_activate` | core/types |
| `Channel` | delivery surface | `kind`, `address`, `requires_approval_to_send` | core/types |
| `Run` | execution record | `practice`, `status`, `receipts`, `gate_decisions` | core/types |
| `Receipt` | proof artifact | `kind`, `ref`, `proves[]` | core/types |
| `Approval` | scoped, time-bound consent | `scope`, `requirement`, `expires_at`, `status` | core/types |
| `CharterRef` | typed handle to a file-based charter run | `slug`, `status`, `acceptance_criteria` | core/types |

## Invariants (non-negotiable)

1. **Files = truth, Memory = lessons, UI = workspace.** Live state lives in files
   (Charter: `$CHARTER_HOME/charters/`), never in agent memory. Memory holds lessons.
2. **Approval floor.** Every `PracticeSpec.approval_required_for` is a superset of
   `APPROVAL_FLOOR` (`enabling-globally`, `external-side-effects`,
   `permission-expansion`). A Practice may add more; it can never remove these.
3. **No artifact, no progress.** Every Run produces a Receipt or a block. (Charter:
   two no-evidence loops force block/sharpen.)
4. **Done requires proof.** Completion maps every `AcceptanceCriterion` to a Receipt.
   Any unmapped criterion ⇒ not done.
5. **Gates outrank logic.** A fired gate sets the Run to `blocked` (not `failed`) and
   waits for an `Approval` that is `approved`, unexpired, and in-scope.
6. **Attention is a one-way door.** Activating a recurring Routine spends the human's
   finite attention, so it requires the human's nod.

## Status lifecycles

```txt
Practice : draft -> active -> deprecated
Run      : running -> (blocked) -> success | aborted | failed
Approval : pending -> approved | denied | expired
Routine  : proposed -> trial -> active -> paused -> retired
Charter  : draft -> active -> (blocked) -> complete | cancelled
```

## What depends on this contract

- **practices/core** — implements/validates `PracticeSpec` + `PracticeMetrics`; the
  loader that reads `practices/<slug>/practice.yaml` into these types.
- **routines** — composes Practices via `Routine` / `RoutineStep` / `Schedule`.
- **channels** — delivers `Run` results via `Channel` (gated outbound).
- **desktop** — a workspace/view over `PracticeSpec`, `Run`, `Approval`, `PracticeMetrics`.

## Change policy

Operational (no approval): docs/examples, additive optional fields that don't change
meaning, comments.

Legitimacy (review required): renaming or removing a primitive, changing a status
enum, weakening an invariant, or altering `APPROVAL_FLOOR`. These are exactly the
"meaning drift" risks this contract exists to prevent.
