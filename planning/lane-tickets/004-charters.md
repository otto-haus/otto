# 004 — Charters

Status: done
Owner: Claude
Priority: P1
Depends on: 003

## Outcome

Otto can run against explicit user-approved operating contracts.

## Scope

- Charter create/read/update surface.
- Charter state.
- Link runs and receipts to charters.
- Approval gates for charter changes.

## Done when

- User can create a charter.
- Otto can attach a run to a charter.
- Charter progress/state is visible.
- Charter changes produce receipts.

## Proof

- HQ: 006 Charters Contract, 007 Charters Surface
- Smoke: `/Users/seb/.codex/admin/otto-007-charters-smoke-20260613T210700.json`
- Worktree: `apps/desktop/electron/charter-store.ts`, Charters surface in `Panes.tsx`
- Verified: create/read/update + receipt linkage (2026-06-13)
