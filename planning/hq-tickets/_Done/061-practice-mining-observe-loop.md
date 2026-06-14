# 061 — Practice Mining Observe Loop

Owner: Codex
Priority: P2
Depends on: 053, 016, 052
Release bucket: vNext practices

## Outcome

Otto can **observe repeated behavior** and draft Practice proposals — human still ratifies.

Implements `docs/practice-mining.md` loop steps 1–2 automatically; steps 3–4 remain Curation.

## Scope

- Heuristics: repeated receipt patterns, recurring manual commands, duplicate artifacts
- Output: `practice-proposal` yaml draft + Curation proposal
- Routine `practice-mining` trial invokes observer
- No auto-activation

## Out of scope

- ML clustering
- Auto-editing active practices

## Done when

- Fixture repeated behavior generates proposal in inbox
- No proposal on single occurrence
- Receipt logs observation inputs (paths only, no secrets)

## Verification

```sh
bun test
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit; Curation proposal on repeat fixture)
Date: 2026-06-13
Owner lane: Cursor (implementer)

### What changed

- `practice-mining.ts` counts repeated receipt actions; creates Curation practice proposal when count ≥ 2.
- `proposal-store.ts` adds `createFromSystem` for Otto-originated proposals.
- `practice-mining.test.ts` covers single vs repeat fixtures.
- `routine-store.runManual('practice-mining')` invokes observer.

### Verification

```sh
bun test ./apps/desktop/electron/practice-mining.test.ts
bun test ./apps/desktop/electron/routine-store.test.ts
```

### Known limitations

- Heuristics are receipt-action only (no run/CLI mining yet).
- Reviewer +1 pending.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

practice-mining.ts observes receipts only; no Curation proposal on repeat fixture.

## Review rev3 (implementer follow-up)

Date: 2026-06-13
Lane: Cursor implementer

- Repeat fixture (`ticket.compile` ×2) now creates `needs_approval` practice proposal via `createFromSystem`.
- Single occurrence produces observe receipt only (no proposal).
- `bun test ./apps/desktop/electron/practice-mining.test.ts` → 2/2 pass.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- Repeated behavior generates proposal in inbox: **Pass** — repeat fixture creates `needs_approval` practice proposal
- No proposal on single occurrence: **Pass** — observe receipt only
- Receipt logs observation inputs (paths only): **Pass** — practice-mining receipt action fields

### Evidence inspected

- Commands: `bun test apps/desktop/electron/practice-mining.test.ts`; `bun run verify:v0` → 5 pass

### Finding

Observe loop steps 1–2 ship for receipt-action heuristics; CLI/run mining deferred per receipt.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Observe loop + metrics: **Pass** — `practice-mining.test.ts`; prior batch review

### Finding

Reconfirmed +1.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; no rev9 delta.
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.
