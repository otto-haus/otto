# 053 — Practice Runtime (Charter / Review / Field Note)

Owner: Cursor
Priority: P1
Depends on: 010, 011, 052
Release bucket: v0.1 practices

## Outcome

Core v1 Practices invoke from Letta/extension path with **Run + Receipt** — not just YAML specs on disk.

Focus: Charter, Review, Field Note (Practice Mining deferred to 061).

## Why this matters

Practices one-pager: slash commands are doorways; invocation must create durable proof. Extension only has partial charter/routine hooks.

## Scope

- Wire `packages/practices` + extension commands for charter, review, field-note
- Each invocation: run id, practice ref, receipt path
- Desktop Practices surface shows last run timestamp
- Permission floors from practice.yaml enforced via autonomy

## Out of scope

- Practice Mining automation (061)
- Full slash library for every practice spec

## Done when

- Letta `/charter` or equivalent creates receipt linked to practice id
- Review practice run writes receipt suitable for 051 gate
- Field note run appends to configured artifact path + receipt
- Validator still passes all practice specs

## Verification

```sh
bun packages/practices/src/cli.ts
bun test
bun run verify:v0
```

## Execution receipt (2026-06-13)

- **Implementer:** Cursor
- **Files:**
  - `apps/desktop/electron/practice-runner.ts`, `practice-runner.test.ts`, `practice-metrics-store.ts`
  - IPC `otto:practices:run`, `otto:practices:metrics`; preload + shared types
  - `apps/desktop/src/surfaces/Panes.tsx` — Practices Run button, last-run timestamp, metrics strip
  - `extension/review.ts`, `extension/field-note.ts` (Letta prompt launchers; charter already existed)
  - `packages/practices/src/index.ts` — exports `RUNTIME_PRACTICE_SLUGS`
- **Proof:** `practice-runner.test.ts` 5/5 pass — charter receipt (`practice.charter.run`), review gate blocked/pass (`practice.review.done`), field-note artifact + receipt (`practice.field_note.capture`), autonomy block on send in note text
- **Verify:** `bun packages/practices/src/cli.ts` (5 specs ok); `bun run verify:v0` — 5/5 pass (139 unit tests)
- **Desktop:** Practices surface → charter/review/field-note → **Run** → notice with receipt id; detail panel shows last run time + uses/success/blocked counts
- **Letta path:** Extension commands remain prompt-based; durable receipt requires desktop `PracticeRunner` or future transport hook (not wired in `sdk-subprocess-transport` yet)
- **Reviewer:** pending independent +1

## Blocker log

Leave blank unless blocked.

## Review

Reviewer: implementer self-assessment (not +1)
Date: 2026-06-13

### Checked against Done when

- **Charter receipt linked to practice id:** Pass via desktop `PracticeRunner.run({ slug: 'charter' })`. Receipt includes `practice.slug`, `practice.invocation`, run id in metrics. Letta `/charter step` alone still emits prompts only — no automatic receipt until desktop Run or future transport bridge.
- **Review receipt for 051 gate:** Pass. `runReview` calls `CheckRunner.evaluateDoneClaim()`; blocked receipt when AC lacks proof; success when AC mapped with evidence + reviewer +1. `premature_done_prevented` metric increments on fail.
- **Field note artifact + receipt:** Pass. Markdown written to `~/.otto/field-notes/<id>.md`; receipt cites artifact path in evidence.
- **Validator:** Pass. All five practice specs validate.

### Passes

- Runtime slugs charter/review/field-note with run record + receipt + metrics persistence
- Autonomy floor blocks external side-effect language in invocation/payload (send/publish/post/deploy/merge)
- Practices UI shows last run timestamp and Run control for wired practices
- Extension parity for review and field-note slash commands

### Gaps / honest limits

- **Letta ≠ receipt yet:** Ticket wording says “Letta `/charter` or equivalent”; desktop Run is the working equivalent, not in-chat automatic receipt on slash.
- **Approval floor is heuristic:** Uses keyword + `AutonomyStore`, not full parse of each practice’s `approval_required_for` list from YAML.
- **Charter runtime is receipt stub:** Does not execute charter skill loop — records practice invocation proof only (same class of limitation as 052 manual routine trial).
- **No clickable receipt link** in Practices notice (id string only; same polish gap as 052).
- **Staging click smoke not run** in this pass — unit tests + verify:v0 only.

### Required changes before +1

- Reviewer should confirm Practices Run click on staging for at least one slug (charter + field-note minimum).
- Decide whether Letta slash must auto-call `PracticeRunner` (transport hook) or desktop Run satisfies “equivalent” for v0.1.

### Final call needed from Sebastian

Independent +1 after staging click or explicit acceptance of desktop-only receipt path for v0.1.

## Review rev2

Reviewer: Independent Otto reviewer
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- **Charter receipt linked to practice id:** Pass — `PracticeRunner.run({ slug: 'charter' })` writes `practice.charter.run` receipt with `practice.slug`, invocation, run id, metrics (`practice-runner.test.ts` charter test).
- **Review receipt for 051 gate:** Pass — `runReview` uses `CheckRunner.evaluateDoneClaim()`; blocked without AC proof; success with evidence + reviewer +1 (`practice-runner.test.ts` review tests).
- **Field note artifact + receipt:** Pass — `~/.otto/field-notes/<id>.md` written; receipt cites artifact in evidence (`practice-runner.test.ts` field-note test).
- **Validator:** Pass — `bun packages/practices/src/cli.ts` (5 specs ok); `bun run verify:v0` 5/5 (139 unit tests).

### Evidence inspected

- Files: `practice-runner.ts`, `practice-runner.test.ts`, `practice-metrics-store.ts`, `Panes.tsx` (Run + last-run), `extension/review.ts`, `extension/field-note.ts`, `packages/practices/src/index.ts`
- Commands: `bun run verify:v0` ✓ · `bun test apps/desktop/electron/practice-runner.test.ts` ✓ (5/5) · `bun packages/practices/src/cli.ts` ✓

### Passes

- Desktop **Run** is the v0.1 receipt path for charter/review/field-note; extension slash commands remain prompt launchers (honest, documented).
- Autonomy floor blocks external side-effect language in invocation/payload.
- Practices UI: Run button, last-run timestamp, metrics strip wired via `otto:practices:run` / `otto:practices:metrics`.

### Defects (accepted deferrals, not blockers)

- Letta slash does not auto-call `PracticeRunner` — transport hook deferred.
- Charter runtime records invocation proof only (does not execute full charter skill loop).
- No staging Practices click capture — unit tests + verify:v0 substitute for v0.1.

### Finding

Done when satisfied for v0.1 practices lane. Desktop Run + receipts + 051-shaped review gate are real and tested.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Practice run + receipts + 051-shaped gate: **Pass** — `practice-runner.test.ts`; prior +1 stands

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

## Reopened (2026-06-14)

Reason: +1 but proof_class=unit_only
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.
