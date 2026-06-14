# 003 — Receipts

Status: done
Owner: Claude
Priority: P0
Depends on: 001, 002

## Outcome

Every meaningful Otto run writes a durable receipt.

## Scope

- Receipt model.
- Receipt storage.
- Receipt list/detail surface.
- Link chat/run events to receipts.
- Honest failed/blocker receipts.

## Done when

- Successful run writes a receipt.
- Failed/blocked run writes a truthful receipt.
- Receipt shows inputs, actions, result, evidence, timestamp, and blocker if any.
- User can open receipts in the app.

## Proof

- HQ: 004 Receipt Contract, 005 Receipts Surface
- Smoke: `/Users/seb/.codex/admin/otto-004-receipt-smoke-20260614T032125Z.json`, `otto-005-receipts-smoke-20260613T204500.json`
- Worktree: `packages/core/src/types.ts` (Receipt), `apps/desktop/electron/receipt-store.ts`
- Verified: success/failure/blocker receipts durable; Receipts surface in sidebar (2026-06-13)
