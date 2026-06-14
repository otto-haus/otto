# This Cycle ↔ HQ ticket mapping

Canonical conveyor queue: `~/Library/CloudStorage/Dropbox/HQ/Otto Tickets`

This folder uses **lane numbers** (001–009 + gate 016). HQ uses **capability tickets** (001–018 + polish). Status here tracks the same proof as HQ `_Done`.

Updated: 2026-06-14 (wave 5 complete; gate 016 / HQ 018 done)

| This Cycle | Status | HQ tickets | Proof (smoke / receipt) |
|---:|---|---|---|
| 001 Chat Surface | done | 002, 003 | `otto-002-chat-send-smoke-20260614T023917Z.json`, `otto-003-chat-*` |
| 002 Settings + Letta | done | 001 | `otto-001-connected-settings-smoke-20260614T023015Z.json` |
| 003 Receipts | done | 004, 005 | `otto-004-receipt-smoke-20260614T032125Z.json`, `otto-005-receipts-smoke-20260613T204500.json` |
| 004 Charters | done | 006, 007 | `otto-007-charters-smoke-20260613T210700.json` |
| 005 Standards | done | 008, 009 | `otto-008-standards-smoke-20260613T220000.json` |
| 006 Practices | done | 010, 011 | `otto-010-practices-smoke-20260613T221500.json`, `otto-011-practices-surface-smoke-20260613T223000.json` |
| 007 Routines | done | 012, 013 | `otto-012-routines-contract-smoke-20260613T223000.json` |
| 008 Curation | done | 014, 015, 016 | `otto-014-*`, `otto-015-*`, `otto-016-curation-decisions-smoke-20260613T230000.json` |
| 009 Autonomy | done | 017 | `otto-017-autonomy-policy-smoke-20260613T231500.json` |
| 016 Readiness gate | done | 018 | `otto-018-readiness-gate-smoke-20260614T040000.json` |

Worktree (uncommitted implementation): `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

Verification (shared): `bun test ./electron/*.test.ts` → 25 pass; `bun run typecheck` → pass

Smoke root: `/Users/seb/.codex/admin/`
