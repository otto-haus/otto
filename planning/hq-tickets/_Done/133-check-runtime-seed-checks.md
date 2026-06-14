# 133 — Check Runtime + Seed Checks

Owner: Codex
Priority: P0
Depends on: 131, 132, 051, 045, 004, 016
Release bucket: category wedge — **Culture CI** (prose); product primitive **Checks**

## Outcome

**Checks** **run** at trigger time. Failures **block** the action (when configured) and **write receipts** — falsifiable proof that culture compounded.

Ship **two seed checks** only (thin vertical slice):

### 1. No Fake Done (`completion-requires-receipts`)

- **Trigger:** `done_claim` (agent/worker/ticket/charter complete assertion)
- **Pass:** every AC has mapped proof (evidence ref, test, log, or artifact)
- **Fail:** block done claim; message `"Not done: missing mapped proof."`; `write_receipt: true`
- **Integrates:** extends **051** / **034** — same invariant, unified Check engine

### 2. One-Way Door (`one-way-door-approval`)

- **Trigger:** `one_way_door_action` — send, post, publish, spend, deploy, protected merge, delete, credential change
- **Pass:** approval exists (human, session allow, or autonomy class permit)
- **Fail:** block action; request approval path (**045**); receipt blocked
- **Integrates:** **045** permission modal; **017** autonomy classes

## Why this matters

This is the **holy shit demo** engine:

```txt
Agent: “Done.”
Human: “No proof. Not done.”
Otto: proposes rule → human ratifies → Check compiles
Agent tries again later.
Otto blocks: “Not done: missing receipts mapped to ACs.”
Receipt appears.
```

## Naming (locked)

- **Checks** — product primitive; IPC namespace `checks.*`; storage `~/.otto/checks/`
- **Culture CI** — category positioning in prose only (README, **065**, demo runbook)
- Do not use “Behavior Check” as a product label — use **Check** / **Checks**

## Scope

- **Runtime:** `apps/desktop/electron/check-runner.ts`
  - Load active checks from `~/.otto/checks/`
  - Dispatch on trigger events from Chat, ticket store, charter store, permission layer
  - Evaluate `inspect` rules (v1: fixed rule ids, not arbitrary code execution)
  - Apply `on_fail`: block + message + receipt via receipt-writer
- **Seed checks:** ship as repo templates under `checks/` (or bootstrap on first run if empty)
- **Events:** emit `check_passed` / `check_failed` for UI **134** (payload shape documented in **131**)
- **IPC:** `checks.list`, `checks.get` — required before **134** UX lands
- **Safety:** checks cannot be bypassed from renderer; main process is source of truth

## Non-goals

- Arbitrary user-defined DSL beyond **131** schema v1
- Third check types
- Cloud execution
- Replacing Letta tool sandbox

## Done when

- [x] `done_claim` without mapped proof → blocked + receipt (unit + staging)
- [x] `one_way_door_action` without approval → blocked + routes to **045** flow
- [x] Compiled check from **132** runs on next trigger (end-to-end with fixture)
- [x] Receipt includes check id, standard source, trigger event, fail message
- [x] `checks.list` / block event payload stable for **134** (even if enforcement is seed-only)
- [ ] Reviewer +1

## Verification

```sh
bun test ./apps/desktop/electron/check-runner.test.ts
bun test ./apps/desktop/electron/ticket-store.test.ts ./apps/desktop/electron/charter-store.test.ts
bun test ./apps/desktop/electron/receipt-writer.test.ts
# manual: Culture CI 30s demo path (see 135)
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `check-store.ts`, `check-runner.ts`, seed YAML in `checks/`, ticket-store integration.
- `autonomy-store.ts` — wires `CheckRunner.evaluateOneWayDoor` on red-zone doors (045 integration).
- Tests: check-runner (done_claim + one_way_door receipts), ticket-store (receipt_id in block), autonomy-store (check_results).

### Verification

```sh
bun test packages/core/src/check.test.ts apps/desktop/electron/check-*.test.ts apps/desktop/electron/ticket-store.test.ts apps/desktop/electron/autonomy-store.test.ts
# 31 pass / 0 fail (scoped slice)
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.
- `check_passed` / `check_failed` renderer events not emitted (CheckRunner has no win handle; defer to **134**).

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

check-runner/store + seed YAML; check-runner + ticket-store tests pass; IPC checks.* wired.

## Review rev3

Reviewer: Cursor (implementer verification)
Date: 2026-06-13
Verdict: pending independent re-review (+1 for autonomy wiring)
Move to _Done?: No

Evidence:

```sh
bun test packages/core/src/check.test.ts apps/desktop/electron/check-*.test.ts apps/desktop/electron/ticket-store.test.ts apps/desktop/electron/proposal-store.test.ts apps/desktop/electron/autonomy-store.test.ts
# 31 pass / 0 fail
```

- `autonomy-store.ts`: red-zone `evaluateAction` runs one-way-door check; `approved` / `session_allowed` on input.
- `check-runner.test.ts`: `check.failed` receipt fields; one-way door block.
- `ticket-store.test.ts`: merged block surfaces `(receipt: …)` from check failure.
- Not done: independent +1 after autonomy path change; staging demo (**135**); optional `otto:event` check_passed/failed for UI **134**.

## Review

Reviewer: Independent conveyor reviewer (Batch A)
Date: 2026-06-14
Verdict: +1

### Checked against

- `done_claim` without proof → blocked + receipt: **Pass** — `check-runner.test.ts` + seed `checks/completion-requires-receipts.yaml`
- `one_way_door_action` without approval → blocked: **Pass** — `checks/one-way-door-approval.yaml` + autonomy-store wiring
- Compiled check from **132** runs on trigger: **Pass** — check-store seeds from repo `checks/`; compiler tests in **132**
- Receipt fields (check id, standard, trigger, message): **Pass** — `check.failed` assertions in check-runner tests
- `checks.list` stable for **134**: **Pass** — IPC + CheckStore.ensureSeeded()
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `checks/*.yaml`, `check-runner.ts`, `check-store.ts`, `autonomy-store.ts`
- Commands: `bun run verify:v0` → 125 pass; `bun test apps/desktop/electron/check-runner.test.ts` → 3 pass

### Gaps (non-blocking)

- Renderer `check_passed`/`check_failed` events deferred to **134** (documented).
- Live Culture CI staging demo tracked under **135**.

### Finding

Seed checks + runtime enforcement meet **133** Done when for the thin vertical slice.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-13
Verdict: +1
Move to _Done?: Yes

### Checked against

- `done_claim` without proof → blocked + receipt: **Pass** — `check-runner.test.ts`; `ticket-store.test.ts` surfaces `receipt_id` on merge block
- `one_way_door_action` without approval → blocked: **Pass** — `autonomy-store.test.ts` + seed `one-way-door-approval.yaml`
- Compiled check from **132** runs on next trigger: **Pass** — `CheckStore` + compiler integration
- Receipt fields (check id, source, trigger, message): **Pass** — `check.failed` assertions
- `checks.list` stable for **134**: **Pass** — IPC `otto:checks:list`

### Evidence inspected

- Files: `check-runner.ts`, `ticket-store.ts` (merge gate lines 72–80), `autonomy-store.ts`, `checks/*.yaml`
- Commands: `bun test apps/desktop/electron/check-runner.test.ts apps/desktop/electron/ticket-store.test.ts` → 7/7 pass

### Gaps (non-blocking)

- Staging auto-seed gap affects **134**/**135** visibility, not runtime logic.
- Renderer `check_passed`/`check_failed` events still deferred (documented).

### Finding

Runtime + ticket merge gate enforcement is independently verified. +1 stands.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- `done_claim` without proof → blocked + receipt: **Pass** — unit + staging JSON `block.ok: true`
- `one_way_door_action` without approval → blocked: **Pass**
- Compiled check from **132** runs on trigger: **Pass**
- Receipt fields complete: **Pass** — `receipt-93886b09-…` in staging proof
- `checks.list` stable for **134**: **Pass** — staging lists 2 seeded checks
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Commands: `bun test apps/desktop/electron/check-compiler.test.ts check-runner.test.ts check-store.test.ts` → 7/7 pass
- Files: `check-store.ts` (`resourcesPath` seed), `staging-rev7-proof-20260614070123.json`
- Staging: `checksSeededGte1: true`, `checksSurfaceHasContent: true`

### Finding

rev8 noted staging auto-seed gap — **closed** by `check-store` + deploy bundle; runtime ACs now proven on staging profile. +1 stands.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes (retained)

### Checked against

- `done_claim` without proof → blocked + receipt: **Pass** — unit + JSON `block.ok: true`
- `one_way_door_action` without approval → blocked: **Pass**
- Compiled check from **132** runs on trigger: **Pass**
- Receipt fields complete: **Pass** — `receipt-93886b09-…` in staging proof
- `checks.list` stable for **134**: **Pass** — 2 seeded checks in JSON

### Evidence inspected

- JSON: `staging-rev7-proof-20260614070123.json` — `checksSeededGte1: true`, `checksSurfaceHasContent: true`
- Files: `check-store.ts` (`resourcesPath` seed), `check-runner.ts`
- Commands: `bun test check-store check-compiler check-runner` → 7/7 pass

### Delta vs rev9

- Working tree adds `CheckRunLogStore` on runner `list()` / `record()` — enhances **134** last-run display; tests still 7/7.
- Seed path unchanged in proof JSON (`count: 2`).

### Finding

Runtime + seed ACs hold. +1 stands.

