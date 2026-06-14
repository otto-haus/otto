# Otto v1 — Ship Status

Updated: 2026-06-13

Worktree (uncommitted): `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

Lane tickets (This Cycle): `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/tickets` — 001–009 + 016 **done**

HQ conveyor: `~/Library/CloudStorage/Dropbox/HQ/Otto Tickets` — 001–018 **_Done**

Smoke root: `/Users/seb/.codex/admin/`

Shared verification (2026-06-13):

```sh
cd /Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613/apps/desktop
bun test ./electron/*.test.ts   # 25 pass
bun run typecheck               # pass
```

## Lane completion

| Lane | Surface | Status | Primary smoke |
|---:|---|---|---|
| 001 | Chat | done | `otto-002-chat-send-smoke-20260614T023917Z.json` |
| 002 | Settings + Letta | done | `otto-001-connected-settings-smoke-20260614T023015Z.json` |
| 003 | Receipts | done | `otto-004-receipt-smoke-20260614T032125Z.json` |
| 004 | Charters | done | `otto-007-charters-smoke-20260613T210700.json` |
| 005 | Standards | done | `otto-008-standards-smoke-20260613T220000.json` |
| 006 | Practices | done | `otto-010-practices-smoke-20260613T221500.json` |
| 007 | Routines | done | `otto-012-routines-contract-smoke-20260613T223000.json` |
| 008 | Curation | done | `otto-016-curation-decisions-smoke-20260613T230000.json` |
| 009 | Autonomy | done | `otto-017-autonomy-policy-smoke-20260613T231500.json` |
| 016 | Readiness gate | done | `otto-018-readiness-gate-smoke-20260614T040000.json` |

Mapping: `tickets/000-hq-sync.md`

## Ship Check summary

| Surface | Check | Decision | Gap |
|---|---|---|---|
| Desktop | `[~]` | Ship as Proposed | No demo video; staging worktree only |
| Runs/Receipts | `[x]` | Ship in v0.1 | Repo `receipts/otto-v01/*.md` not refreshed |
| Charter | `[~]` | Ship as Proposed | Desktop surface yes; full extension CLI partial |
| Standards | `[x]` | Ship in v0.1 | File-backed + surface; no demo |
| Practices | `[~]` | Ship as Proposed | Surface + specs; CLI path partial |
| Routines | `[~]` | Ship as Proposed | Manual run yes; no automated executor |
| Curation | `[x]` | Ship in v0.1 | Proposal + accept/reject/defer + canon ratify |
| Autonomy | `[x]` | Ship in v0.1 | `v1/contracts/autonomy-policy.yaml` + desktop classifier |
| Approvals | `[~]` | Defer | Folded into curation/autonomy gates |
| Tickets | `[~]` | Ship as Proposed | HQ conveyor active; ticketcraft runtime partial |
| Skills | `[ ]` | Defer | Not in lane 001–009 |
| Knowledge | `[ ]` | Defer | Not in lane 001–009 |
| Channels | `[ ]` | Defer | 010–011 blocked on gate |
| Worker orchestration | `[~]` | Defer | Policy only; no automated workers |
| Release gate | `[ ]` | Blocked | No push/tag; Sebastian approval required |

Detail per surface: `SHIP_CHECKS/*.md`

## Not shipped (honest)

- Demos (`demo/out/*.mp4`) not refreshed for this wave
- Public push / tag / npm publish
- Intake, Discord, Paperclip (lane 010–013) — blocked on gate 016
- Live `/Applications/otto.app` — staging worktree only

## Next

1. Unpark HQ `019` Intake (or This Cycle `010`) when Sebastian chooses next adapter
2. Commit worktree when approved
3. Refresh repo demos/receipts (still gap)
