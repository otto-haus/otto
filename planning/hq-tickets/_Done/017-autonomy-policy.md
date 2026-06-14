# 017 — Autonomy Policy

Owner: Codex
Priority: P2
Depends on: 016

## Outcome

Otto can act independently only inside visible, approved boundaries.

## Scope

- Autonomy settings/policy.
- Safe vs consequential action boundary.
- Approval requirements.
- Receipt for autonomy decisions.

## Done when

- User can see what Otto may do alone.
- Consequential actions require approval.
- Autonomy decisions write receipts.
- App does not imply broader autonomy than implemented.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `017` depends on `016`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../017-autonomy-policy.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `016` is not accepted.

### Required changes

- Complete and accept `016` into `_Done`.
- Implement ticket `017`.
- Append an execution receipt proving visible autonomy scope, approval gate for consequential actions, autonomy decision receipts, and no overstated autonomy.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: fake-done

### Checked against

- User can see what Otto may do alone: **PASS (code)** — `Autonomy` surface loads `autonomy/policy.yaml` zones/doors.
- Consequential actions require approval: **PASS (code/tests)** — `autonomy-store.test.ts` red-zone deploy blocked.
- Autonomy decisions write receipts: **PASS (code/tests + external smoke)** — evaluate writes receipt ids.
- App does not overclaim autonomy: **PASS (code)** — limitation string on surface; policy-driven classification only.

### Evidence inspected

- Files: `autonomy-store.ts`, `autonomy-store.test.ts`, `autonomy/policy.yaml`, `Panes.tsx` Autonomy
- Artifacts: `/Users/seb/.codex/admin/otto-017-autonomy-policy-smoke-20260613T231500.json` (`ok: true`)
- Ticket file: **no `## Execution receipt`**; only prior `Verdict: blocked` review

### Defects

- Ticket moved to `_Done` without implementer execution receipt mapped to Done-when.
- No independent `+1` exists in the ticket file.
- Violates canon: "No proof mapped to Done when = no +1."

### Required changes

- Append execution receipt with Done-when mapping.
- Re-review after receipt exists; do not treat external smoke alone as ticket proof.

### Finding

Implementation appears present, but folder state ahead of proof — fake-done at ticket level.

## Execution receipt

Status: pass (unit + policy docs; closes rev8 fake-done)
Date: 2026-06-14
Repo: `/Users/seb/Code/otto`
Branch: `ship/v0.3-integration`
Git: `fff0152`

### Done-when mapping

| Done when | Proof |
|-----------|-------|
| User can see what Otto may do alone | `autonomy/policy.yaml` green/yellow/red zones + doors; Autonomy surface in `Panes.tsx`; doctrine in `docs/autonomy.md` § Product model / What Autonomy may do |
| Consequential actions require approval | `autonomy-store.test.ts` — deploy → red zone, `requires_approval`, `one-way-door-approval` check fails without session |
| Autonomy decisions write receipts | `autonomy-store.test.ts` — `evaluateAction writes autonomy decision receipt` (`autonomy.action.evaluate`, subject `autonomy`, blocked/success) |
| App does not overclaim autonomy | `autonomy-store.test.ts` — unknown → yellow not green; policy `limitations` includes Ticketcraft; `docs/autonomy.md` § Doctrine (“Approve doors, not steps”) |

### Policy + doc refs

- Machine policy: `autonomy/policy.yaml` (`otto.autonomy.policy.v1`, zones, doors, cognee action classes)
- Human doctrine: `docs/autonomy.md` (orchestrator/worker boundary, escalation list, merge/worktree policy)
- Implementation: `apps/desktop/electron/autonomy-store.ts`, `classifyAction()`, `evaluateAction()`

### Verification

```sh
cd /Users/seb/Code/otto
bun test apps/desktop/electron/autonomy-store.test.ts
# → 11 pass, 0 fail
```

### Staging

Not required for this ticket (file-backed policy + unit proof). External smoke (if present): `/Users/seb/.codex/admin/otto-017-autonomy-policy-smoke-20260613T231500.json`.

Reviewer verdict: pending re-review after receipt.

## Execution rev9

Same as `## Execution receipt` above — rev8 gap closed with in-ticket Done-when mapping to `autonomy-store.test.ts` + `docs/autonomy.md` + `autonomy/policy.yaml`. No code changes in this pass.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

- User can see what Otto may do alone: **PASS** — `autonomy/policy.yaml` + Autonomy surface (`Panes.tsx`).
- Consequential actions require approval: **PASS** — `autonomy-store.test.ts` deploy/red-zone + `one-way-door-approval`.
- Autonomy decisions write receipts: **PASS** — `evaluateAction writes autonomy decision receipt` test.
- App does not overclaim autonomy: **PASS** — unknown→yellow; policy limitations + `docs/autonomy.md`.

### Evidence inspected

- Files: `autonomy-store.ts`, `autonomy/policy.yaml`, `docs/autonomy.md`
- Commands: `bun test apps/desktop/electron/autonomy-store.test.ts` → 11 pass (rev9 spot-run)
- Ticket: `## Execution receipt` + Done-when table

### Finding

Rev8 fake-done cleared: in-ticket execution receipt maps all Done-when items with unit proof.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- User can see what Otto may do alone: **PASS** — `autonomy/policy.yaml` + Autonomy surface (`Panes.tsx`).
- Consequential actions require approval: **PASS** — `autonomy-store.test.ts` deploy/red-zone + `one-way-door-approval`.
- Autonomy decisions write receipts: **PASS** — `evaluateAction writes autonomy decision receipt` test.
- App does not overclaim autonomy: **PASS** — unknown→yellow; `docs/autonomy.md` limitations.

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

No rev10 execution receipt; rev9 Done-when mapping and artifacts hold.
