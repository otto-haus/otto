# 008 — Curation Skeleton

Status: done
Owner: Claude
Priority: P0
Depends on: 003, 005, 006

## Outcome

Corrections and lessons become explicit proposals, not silent behavior changes.

## Scope

- Curation inbox.
- Proposal model.
- Consequence classification.
- Accept/reject/defer decisions.
- Receipt for every decision.
- Minimal canon update path for Standards/Practices.

## Non-goals

- No complex workflow builder.
- No automatic high-risk canon changes.
- No Paperclip dependency.
- No broad Intake pipeline yet.

## Done when

- A user correction creates a proposal.
- Safe/reversible vs consequential changes are distinguished.
- User can accept/reject/defer.
- Accepted proposal updates relevant canon.
- Rejected proposal writes a receipt and does not change canon.
- Next run reflects accepted change.

## Proof

- HQ: 014 Curation Proposal, 015 Curation Inbox, 016 Curation Decisions
- Smoke: `/Users/seb/.codex/admin/otto-014-curation-proposal-contract-smoke-20260613T223000.json`, `otto-015-curation-inbox-smoke-20260613T223000.json`, `otto-016-curation-decisions-smoke-20260613T230000.json`
- Worktree: `apps/desktop/electron/proposal-store.ts`, Curation surface Accept/Reject/Defer
- Verified: accept ratifies canon; reject/defer leave canon unchanged + receipts (2026-06-13)
