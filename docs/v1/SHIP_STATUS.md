# Otto v1 — Ship Status

Updated: 2026-06-14

Integration branch: `ship/functional-labs` (codename — not product semver; post-054 integration commit)

**Product line:** **`v0.1.x`** — tag **`v0.1.3`** marks the integration/demo line (pre-release until Sebastian gate). Mistaken local tags `v0.2.x` / `v0.3.0` deleted; never use integration branch names as semver.
**Staging proof:** `/Applications/otto-staging.app` only — live app unchanged.

Lane tickets (historical): `planning/lane-tickets/` — 001–009 + 016 **done**

HQ conveyor (canonical): `planning/hq-tickets/` — `_Done/` **62**, root **35** active (29 reopened + **136–141** ship/labs + **142** ceremony), `_Parked/` **29**. Audit: `planning/hq-tickets/000-audit-status.md`. Tier truth: `docs/v1/ship-tier-matrix.md`.

Smoke root: `/Users/seb/.codex/admin/`

Shared verification (2026-06-14):

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

Mapping: `planning/lane-tickets/000-hq-sync.md`

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
| Tickets | `[~]` | Proposed | **049, 051 reopened** — orchestrate/review gate need staging proof |
| Skills | `[~]` | Proposed | **066 reopened** — seed library incomplete |
| Knowledge | `[~]` | Ship as Proposed | Registry/routing **proposed**; **055 reopened** — store + pane need staging re-proof |
| Channels | `[x]` | Ship in v0.1 | File contract + pane; **056 reopened** — Discord bot deferred |
| Otto Cloud (web) | `[ ]` | Proposed | Spec only |
| Worker orchestration | `[~]` | Proposed | **060 reopened** — bounded runner incomplete |
| Release gate | `[~]` | In progress | `scripts/release-gate.sh` + `verify:v0` green; **063** + **142** Sebastian sign-off open |

Detail per surface: `docs/v1/SHIP_CHECKS/*.md`  
PR split: `docs/v1/runbooks/pr-stack-ship-v03.md`

## Not shipped (honest)

- Demos (`demo/out/*.mp4`) not refreshed for this wave
- Public push / tag / npm publish
- Live Discord bot runtime (channels file contract + approval gates only)
- Letta `/ticket` extension CLI parity (130)
- Live `/Applications/otto.app` — staging worktree only

## Next

1. Execute post-audit waves in `planning/hq-tickets/000-parallel-map.md` (reopened tickets first)
2. Complete **136–141** Ship/Labs lane + **142** ceremony packet
3. Staging smoke on reopened surfaces before moving back to `_Done/`
