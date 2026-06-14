# 006 — Practices

Status: done
Owner: Claude
Priority: P1
Depends on: 005

## Outcome

Otto has reusable ways of working that can improve over time.

## Scope

- Practices surface.
- Practice model.
- Practice detail view.
- Runs can invoke Practices.

## Done when

- User can view Practices.
- A run can identify which Practice it used.
- Practice use appears in receipts.

## Proof

- HQ: 010 Practices Contract, 011 Practices Surface
- Smoke: `/Users/seb/.codex/admin/otto-010-practices-smoke-20260613T221500.json`, `otto-011-practices-surface-smoke-20260613T223000.json`
- Worktree: `practices/`, `apps/desktop/electron/practices-store.ts`
- Verified: Practices surface reads real specs; run linkage (2026-06-13)
