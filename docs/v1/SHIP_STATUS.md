# Otto v1 — Ship Status

Updated: 2026-06-14

Integration branch: `ship/v0.3-integration` @ `0a07320` (pushed; PR stack in `docs/v1/runbooks/pr-stack-ship-v03.md`)

**Draft release:** [otto-haus/otto v0.3.0](https://github.com/otto-haus/otto/releases/tag/v0.3.0) — walkthrough uploaded; **NOT merged/shipped** until Sebastian gate (063).
**Staging proof:** `/Applications/otto-staging.app` only — live app unchanged.

Lane tickets (This Cycle): `/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/tickets` — 001–009 + 016 **done**

HQ conveyor: `~/Library/CloudStorage/Dropbox/HQ/Otto Tickets` — 001–018 **_Done**; 033–056 in flight on integration branch

Smoke root: `/Users/seb/.codex/admin/`

Shared verification (2026-06-13):

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh   # includes verify:v0 + desktop electron:typecheck
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
| Desktop | `[~]` | Ship as Proposed | Staging branch only; no demo refresh |
| Runs/Receipts | `[x]` | Ship in v0.1 | Repo receipts refreshed for tickets/channels |
| Charter | `[~]` | Ship as Proposed | Desktop surface yes; extension CLI partial |
| Standards | `[x]` | Ship in v0.1 | File-backed + surface |
| Practices | `[~]` | Ship as Proposed | Surface + specs; CLI path partial |
| Routines | `[~]` | Ship as Proposed | Manual run yes; automated executor partial |
| Curation | `[x]` | Ship in v0.1 | Proposal + accept/reject/defer + canon ratify |
| Autonomy | `[x]` | Ship in v0.1 | Policy + classifier + knowledge routing read |
| Approvals | `[x]` | Ship in v0.1 | Records from Curation + receipts |
| Tickets | `[x]` | Ship in v0.1 | Desktop compile + orchestrate; `/ticket` CLI deferred |
| Skills | `[x]` | Ship in v0.1 | SkillStore + desktop pane |
| Knowledge | `[~]` | Ship as Proposed | Registry/routing **proposed**; store + pane ship |
| Channels | `[x]` | Ship in v0.1 | File contract + pane; Discord bot deferred |
| Otto Cloud (web) | `[ ]` | Proposed | Spec only |
| Worker orchestration | `[x]` | Ship in v0.1 | TicketOrchestrator + worktrees |
| Release gate | `[~]` | In progress | `scripts/release-gate.sh` + `verify:v0` green (134 unit tests, 2026-06-13); target tag `v0.1.3`; Sebastian sign-off + staging smoke still open |

Detail per surface: `docs/v1/SHIP_CHECKS/*.md`  
PR split: `docs/v1/runbooks/pr-stack-ship-v03.md`

## Not shipped (honest)

- Demos (`demo/out/*.mp4`) not refreshed for this wave
- Public push / tag / npm publish
- Live Discord bot runtime (channels file contract + approval gates only)
- Letta `/ticket` extension CLI parity (130)
- Live `/Applications/otto.app` — staging worktree only

## Next

1. Sebastian reviews PR stack (054) and approves split merges
2. Staging smoke on desktop panes + Culture CI block UX before 063 release sign-off
3. Ratify knowledge routing or keep Proposed claims (055)
