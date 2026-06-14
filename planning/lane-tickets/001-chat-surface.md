# 001 — Chat Surface

Status: done
Owner: Claude
Priority: P0
Depends on: none

## Outcome

User can chat with real Otto in a beautiful chat-first desktop surface.

## Scope

- Chat-first UI.
- Message composer and transcript.
- Real loading/error states.
- No fake sample data.
- No fake connected state.
- Hook for run/receipt creation.

## Done when

- App opens to a usable chat surface.
- Chat is blocked unless Letta readiness is true.
- Sending a message uses the real adapter path, not mock state.
- Exact blocker is shown when chat cannot run.
- A successful exchange can be associated with a run/receipt hook.

## Proof

- HQ: 002 Chat Send, 003 Chat Runtime
- Smoke: `/Users/seb/.codex/admin/otto-002-chat-send-smoke-20260614T023917Z.json`
- Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`
- Verified: chat blocked until Letta ready; real adapter path; `bun test ./electron/*.test.ts` → 25 pass (2026-06-13)
