# 132 — Compile Ratified Standard → Check

Owner: Codex
Priority: P0
Depends on: 131, 048, 126, 008, 009
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

When Curation **accepts** a proposal whose target ratifies a **Standard** (or amends one), otto **compiles** (or updates) a **Check** linked to that Standard.

Compression:

```txt
Correction → Proposal → Ratified Standard → Check → (runtime enforces)
```

## Why this matters

Without compilation, ratification only updates files humans may read. With compilation, ratification updates **what the system can block next time**.

Pairs with **126** (“Behavior updated”) — toast is the human moment; compiled Check is the machine consequence.

## Naming (locked)

- **Checks** — product primitive (peer to Standards, Practices, Receipts); UI labels, IPC, code
- **Culture CI** — category thesis in README/marketing prose only — not a nav or pane title
- **Practices** — repeatable behavior specs; **Checks** — executable regressions compiled from ratified **Standards** (see **131**)

## Scope

- **Compiler module:** `apps/desktop/electron/check-compiler.ts` (or `packages/core` if shared)
- **Inputs:** accepted proposal, target standard path/id, standard body metadata
- **Output:** Check artifact per **131** schema (`otto.check.v1`) written to `~/.otto/checks/<id>.yaml`
- **Provenance:** `source`, `compiled_from_proposal_id`, `compiled_at`, `standard_hash`
- **Idempotency:** re-accept / amend updates check version; does not duplicate ids
- **Fallback:** standards without machine-compilable rules → no check (honest log/receipt), not silent fake check
- **IPC:** `checks.list`, `checks.get` (read-only for UI **134**)
- Hook: Curation accept path after canon apply (**016**, **126**)

## Non-goals

- Compiling Practices/Routines automatically (future; manual seed only in **133**)
- LLM-generated check logic from free text (v1: explicit mapping table / tagged standard sections only)
- Letta memory compilation (**128** remains separate gate)

## Done when

- [x] Accept fixture proposal targeting Standard → check file exists with correct `source`
- [x] Re-accept updates version; `checks.list` returns active checks
- [x] Receipt records `check.compiled` with check id + standard ref
- [x] Unit tests: compile, idempotent update, skip non-compilable standard
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/check-compiler.test.ts
bun test ./apps/desktop/electron/proposal-store.test.ts
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `check-compiler.ts` compiles ratified standards to ~/.otto/checks.
- `check-compiler.test.ts` — compile, version bump, skip non-compilable.
- `proposal-store.ts` — passes receipt writer into CheckCompiler; proposal-store test for standard accept → compile receipt.

### Verification

```sh
bun test packages/core/src/check.test.ts apps/desktop/electron/check-compiler.test.ts apps/desktop/electron/proposal-store.test.ts
# 13 pass (compiler + proposal slice)
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

check-compiler.ts + proposal-store hook; missing check-compiler.test.ts and compile receipt assertions.

## Review rev3

Reviewer: Cursor (implementer verification)
Date: 2026-06-13
Verdict: pending independent +1
Move to _Done?: No

Evidence:

```sh
bun test packages/core/src/check.test.ts apps/desktop/electron/check-compiler.test.ts apps/desktop/electron/proposal-store.test.ts
# 13 pass / 0 fail
```

- `check-compiler.test.ts`: compile quality → `completion-requires-receipts`, `check.compiled` receipt, version bump 1.0.1→1.0.2, skip `judgment` slug.
- `proposal-store.test.ts`: accept standard → `compiledCheckId` + `check.compiled` receipt with `proposal_id`.
- Remaining for _Done: independent reviewer +1, staging proof optional per rev2.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- Accept fixture → check file with correct `source`: **Pass** — `check-compiler.test.ts`
- Re-accept bumps version; `checks.list` returns active: **Pass** — version 1.0.1→1.0.2 test
- Receipt `check.compiled` with check id + standard ref: **Pass** — proposal-store + compiler tests
- Unit tests compile / idempotent / skip non-compilable: **Pass** — 3/3 compiler tests
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Commands: `bun run verify:v0` → 5 pass; `bun test apps/desktop/electron/check-compiler.test.ts apps/desktop/electron/proposal-store.test.ts` → 13 pass scoped

### Finding

Compilation hook on Curation accept is proven in unit tests; staging optional per ticket scope.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- Accept fixture → check file with correct `source`: **Pass** — `STANDARD_CHECK_MAP` + `check-compiler.test.ts`
- Re-accept bumps version; `checks.list` returns active: **Pass** — version bump test 1.0.1→1.0.2
- Receipt `check.compiled`: **Pass** — `ReceiptWriter` action `check.compiled` in compiler
- Unit tests compile / idempotent / skip: **Pass** — 3/3 compiler tests

### Evidence inspected

- Files: `check-compiler.ts`, `proposal-store.ts` accept hook
- Commands: `bun test apps/desktop/electron/check-compiler.test.ts` → 3/3 pass

### Finding

Compiler wedge is proven at unit level. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Accept fixture → check file with correct `source`: **Pass**
- Re-accept bumps version; `checks.list` returns active: **Pass**
- Receipt `check.compiled`: **Pass**
- Unit tests compile / idempotent / skip: **Pass**
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Commands: `bun test apps/desktop/electron/check-compiler.test.ts check-runner.test.ts check-store.test.ts` → 7/7 pass (compiler 3/3)
- Note: rev8 on file was +1; re-grade requested post `check-store` seed fix — seed path is **133**/**134** scope; compiler ACs unchanged

### Finding

Compilation hook proven; packaged seed does not alter compiler contract. +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- Accept fixture → check file with correct `source`: **Pass**
- Re-accept bumps version; `checks.list` returns active: **Pass**
- Receipt `check.compiled`: **Pass**
- Unit tests compile / idempotent / skip: **Pass** — 3/3 compiler tests

### Evidence inspected

- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass (compiler 3/3)

### Delta vs rev9

- Same pass count; no compiler regression on working tree.

### Finding

+1 stands.


## Reopened (2026-06-14)

Reason: +1 but proof_class=unit_only
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.
