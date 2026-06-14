# This Cycle ↔ HQ ticket mapping

**Canonical conveyor:** git repo `planning/hq-tickets/` in `/Users/seb/Code/otto` — not Dropbox.

Mirrors (one-way rsync from repo):

- `~/Library/CloudStorage/Dropbox/HQ/Otto Tickets/`
- This file: `~/Library/CloudStorage/Dropbox/This Cycle/otto/tickets/000-hq-sync.md`

Updated: 2026-06-14 (conveyor audit + 29 reopen)

## Folder truth (HQ)

```txt
_Done:     62
_Parked:   29
Root:      35 numbered (29 reopened + 136–141 ship/labs + 142)
_InReview: empty
Audit:     planning/hq-tickets/000-audit-status.md
```

## Lane map (This Cycle 001–016 → HQ)

Historical lane tickets live in `planning/lane-tickets/`. HQ capability tickets supersede lane numbering for 033+.

| This Cycle | Status | HQ tickets | Proof (smoke / receipt) |
|---:|---|---|---|
| 001 Chat Surface | done | 002, 003 | `otto-002-chat-send-smoke-20260614T023917Z.json` |
| 002 Settings + Letta | done | 001 | `otto-001-connected-settings-smoke-20260614T023015Z.json` |
| 003 Receipts | done | 004, 005 | `otto-004-receipt-smoke-20260614T032125Z.json` |
| 004 Charters | done | 006, 007 | `otto-007-charters-smoke-20260613T210700.json` |
| 005 Standards | done | 008, 009 | `otto-008-standards-smoke-20260613T220000.json` |
| 006 Practices | done | 010, 011 | `otto-010-practices-smoke-20260613T221500.json` |
| 007 Routines | done | 012, 013 | `otto-012-routines-contract-smoke-20260613T223000.json` |
| 008 Curation | done | 014, 015, 016 | `otto-016-curation-decisions-smoke-20260613T230000.json` |
| 009 Autonomy | done | 017 | `otto-017-autonomy-policy-smoke-20260613T231500.json` |
| 016 Readiness gate | done | 018 | `otto-018-readiness-gate-smoke-20260614T040000.json` |

## HQ index 033–142 (folder + smoke pointer)

Smoke root: `/Users/seb/.codex/admin/` and `docs/receipts/staging/`. **Folder** column is authoritative.

| HQ | Folder | Lane / theme | Smoke / receipt hint |
|---:|---|---|---|
| 033–038 | `_Done/` | Bug wave | `docs/receipts/staging/otto-033-*` … `038-*` |
| 039 | root | WS transport | `docs/runtime-transport.md` scorecard open |
| 040 | `_Done/` | Cognee spec | spec-only |
| 041–044 | root | Cognee chain | daemon/MCP receipts pending |
| 045 | root | Chat permission | staging smoke pending |
| 046 | root | Thread switcher | `scripts/otto-staging-two-thread-smoke.cjs` |
| 047 | `_Done/` | Memory observatory | — |
| 048 | `_Done/` | Propose from correction | — |
| 049 | root | Ticket orchestration | rev10 -1 |
| 050 | `_Done/` | Precedent conflict | — |
| 051 | root | No fake done gate | unit only |
| 052–053 | root | Routine/practice runtime | receipts pending |
| 054 | `_Done/` | Repo hygiene | `docs/v1/runbooks/pr-stack-ship-v03.md` |
| 055–056 | root | Knowledge/system surfaces | SHIP_CHECKS `[~]` |
| 057 | `_Done/` | Nav icons | craft |
| 058 | root | Runtime robustness | punchlist |
| 059 | `_Done/` | Command station | — |
| 060–062 | root | Worker/practice/AI loops | stubs |
| 063 | `_Done/` | Release gate packet | Sebastian sign-off open |
| 064–065 | `_Done/` | Demo/marketing | local only |
| 066 | root | Skills seed | — |
| 067 | `_Done/` | One-pagers | — |
| 068 | `_Done/` | pgvector | optional daemon |
| 069–073 | `_Done/` | Onboarding | re-audit if staging fails |
| 076 | root | Embedded Letta | one-app bootstrap |
| 077 | `_Parked/` | Letta cloud | — |
| 078–099 | mixed | see 000-index | parked cloud stack |
| 115–116 | `_Done/` | Marketing pilot | claim boundary |
| 121–128 | root/partial | Culture wedge | 121–126,128 root; 127 `_Done/` |
| 131,133 | `_Done/` | Checks contract/runtime | culture CI |
| 132 | root | Compile standard → check | reopened |
| 134–135 | `_Done/` | Checks UX + demo | re-audit before regress |
| 136–141 | root | Ship/Labs/Cut | `docs/v1/ship-tier-matrix.md` |
| 142 | root | Sebastian ceremony | depends 063, 140 |

## Ship status stub

Full ship table: `/Users/seb/Code/otto/docs/v1/SHIP_STATUS.md` (single source — do not duplicate).

Verification (shared):

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh
```
