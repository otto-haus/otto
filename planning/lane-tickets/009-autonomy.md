# 009 — Autonomy

Status: done
Owner: Claude
Priority: P2
Depends on: 004, 008

## Outcome

Otto can act more independently while respecting gates.

## Scope

- Autonomy settings.
- Door/consequence classifier UI.
- Approval requirements.
- Safe action policy.

## Done when

- User can see what Otto may do alone.
- Consequential actions require approval.
- Autonomy decisions write receipts.

## Proof

- HQ: 017 Autonomy Policy
- Smoke: `/Users/seb/.codex/admin/otto-017-autonomy-policy-smoke-20260613T231500.json`
- Worktree: `autonomy/policy.yaml`, `apps/desktop/electron/autonomy-store.ts`, Autonomy surface
- Verified: green/yellow/red zones; consequential doors block + `autonomy.action.evaluate` receipts; 4 store tests (2026-06-13)
