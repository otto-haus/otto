# 007 — Routines

Status: done
Owner: Claude
Priority: P2
Depends on: 006

## Outcome

Otto can represent recurring work without silently activating it.

## Scope

- Routines surface.
- Routine model.
- Manual activation first.
- Approval gate for recurring activation.

## Done when

- User can view/create a Routine.
- Routine can be manually run.
- Recurring/autonomous activation requires approval.
- Routine run writes a receipt.

## Proof

- HQ: 012 Routines Contract, 013 Routines Surface
- Smoke: `/Users/seb/.codex/admin/otto-012-routines-contract-smoke-20260613T223000.json`
- Worktree: `routines/`, `apps/desktop/electron/routines-store.ts`
- Verified: manual run + approval gate for recurring activation (2026-06-13)
