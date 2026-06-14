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

- [ ] `done_claim` without mapped proof → blocked + receipt (unit + staging)
- [ ] `one_way_door_action` without approval → blocked + routes to **045** flow
- [ ] Compiled check from **132** runs on next trigger (end-to-end with fixture)
- [ ] Receipt includes check id, standard source, trigger event, fail message
- [ ] `checks.list` / block event payload stable for **134** (even if enforcement is seed-only)
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
