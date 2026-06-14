# Ship Check — Autonomy

## Implementation status (2026-06-13)

Ship decision: **Ship in v0.1**

- [x] Policy file: `v1/contracts/autonomy-policy.yaml` (mirrors worktree `autonomy/policy.yaml`)
- [x] `autonomy-store.ts` — zones, doors, `evaluateAction()` + receipts
- [x] Desktop Autonomy surface + action checker IPC
- [x] Smoke: `otto-017-autonomy-policy-smoke-20260613T231500.json`
- [~] Worker orchestration documented in policy only — not automated runtime
- [ ] `docs/autonomy.md` + demo not refreshed

## Spec promise

Autonomy defines what Otto may own without Sebastian in the loop: ticket orchestration, worker management, worktrees, retries, checks, and safe integration steps.

## Required file contract

- [ ] `docs/autonomy.md` exists.
- [ ] Safe/unsafe action taxonomy exists.
- [ ] Worktree policy exists.
- [ ] Merge policy exists.
- [ ] Autonomy settings schema/template exists.
- [ ] Autonomy receipt template exists.

## Required runtime behavior

- [ ] Reversible work can proceed without asking.
- [ ] Consequential doors escalate.
- [ ] Autonomy failures can be logged for Curation.
- [ ] Worker orchestration is at least documented and used manually if not automated.

## Required Desktop surface

- [ ] Desktop Autonomy surface shows ownership boundaries and escalation rules.

## Required demo

- [ ] `demo/out/otto-v01-autonomy-ticketcraft.mp4` shows ticket/worktree/receipt policy.

## Required receipt

- [ ] `receipts/otto-v01/autonomy.md` states docs/templates vs runtime status.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

Choose one:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Truth rule

If it cannot be run, inspected, proven, and approved, it is not Shipped.
