# Ship tier matrix

**Product truth** for functional ship (v0.1.x). Folder `_Done/` is not shippable.

```txt
Ship  = works end-to-end without Labs
Labs  = Coming soon by default; unlock in Settings → Labs
Cut   = not in product UI (spec / parked only)
```

| Field | Value |
|-------|--------|
| **Version line** | `0.1.x` — target first gate tag `v0.1.3` |
| **Matrix date** | 2026-06-15 |
| **Branch** | `main` @ `38171e8` (gate packet **063** / issue **#84**) |
| **Sebastian ack** | *Pending* — tiers below are implementer-validated; Sebastian initials required before declare |
| **Mechanical audit** | `bun run check:ship-tier-matrix` — CI gate for registry ↔ matrix parity |
| **Reviewer +1** | *Pending independent review* — mechanical proof passes; human +1 on “no aspirational Ship rows” |

**Nav policy (decided):** Labs-tier sidebar items stay **visible** with a neutral `coming soon` badge when disabled — honest product, no hidden debt.

**Changelog**

| Date | Change |
|------|--------|
| 2026-06-15 | **556** Settings IA: Knowledge + Channels Ship-tier; Labs sidebar gate removed |
| 2026-06-15 | **084** gate refresh: unit/release gates green; staging rows 3–10 pending Sebastian walk |
| 2026-06-14 | **129** Mechanical matrix audit script + Ship proof-status column |
| 2026-06-14 | **137** Labs gate: master + feature toggles; Knowledge/Channels Labs-tier only |
| 2026-06-14 | Initial matrix from ticket 136 + staging walk |

---

## Sidebar surfaces

| Surface | Tier | Current state | Labs default today | Staging (063) | Proof command / path | Proof status | Owner |
|---------|------|---------------|-------------------|---------------|----------------------|--------------|-------|
| Chat | Ship | Wired; needs live Letta for send | always on | **partial** — unit pass; two-thread smoke pending | `node scripts/otto-staging-two-thread-smoke.cjs` (disposable conv) | staging pending | 002, 046 |
| Settings | Ship | Wired | always on | **pass** — unit + config-store | Settings readiness rows + `bun test apps/desktop/electron/config-store.test.ts` | unit pass | 001, 076 |
| Onboarding | Ship | Partial — dock/receipt gaps | n/a | **partial** — smoke exists; dock visuals open | `node scripts/otto-staging-onboarding-smoke.cjs` (runtime required) | staging pending | 080, 071–073 |
| Charters | Ship | File-backed pane | preview (Labs off) | **pass** — hygiene 2026-06-14 | Open `~/.otto/charters/` + pane list | unit pass | 007 |
| Standards | Ship | File-backed | shipped | **pass** — hygiene 2026-06-14 | `standards/` load + skipped visible (037) | unit pass | 008, 009 |
| Practices | Ship | File-backed | preview | **pass** — hygiene 2026-06-14 | `practices/**/practice.yaml` + pane | unit pass | 010, 011 |
| Routines | Ship | File-backed | shipped | **pass** — gate open #450 | `routines/` + manual run receipt | unit pass | 012, 013, **450** |
| Curation | Ship | Proposal queue | shipped | **pass** — unit + hygiene | deferred filter smoke (036) | unit pass | 014–016, 048 |
| Receipts | Ship | File read | shipped | **pass** — hygiene 124 | `~/.otto/receipts/` + pane detail | unit pass | 004, 005, 124 |
| Checks | Ship | Culture CI pane + Chat block | preview | **partial** — unit pass; **135** demo pending | `docs/v1/demo-culture-ci.md` + **135** demo | staging pending | 131–135 |
| Autonomy | Ship | Policy read/evaluate | shipped | **pass** — unit + prior smoke | `autonomy/policy.yaml` + evaluate receipt | unit pass | 017 |
| Skills | Ship | SkillStore | shipped | **partial** — file tests pass; live staging **066** open | `skill/**/SKILL.md` browse | staging pending | 066 |
| Knowledge | Ship | Registry file-backed; Cognee optional | **open** | **pass** — Settings IA (**556**) | Registry read; optional `knowledge_cognee` in Settings → Advanced | unit pass | 040–044, 055, **556** |
| Tickets | Ship | Compile/orchestrate | shipped | **pass** — hygiene 049 | `node scripts/otto-staging-ticket-proof-capture.cjs` | staging pending | 049 |
| Terminal | Ship | Opens system shell at workspace root | shipped | **pass** — unit | `bun test apps/desktop/electron/open-terminal.test.ts` | unit pass | 283 |
| Channels | Ship | Contract + config; no live bot | **open** | **pass** — Settings IA (**556**) | `channels/channels.yaml` + pane; optional `channels_outbound` | unit pass | 056, **556** |
---

## Chat sub-flows

| Flow | Tier | Current state | Proof | Proof status | Owner |
|------|------|---------------|-------|--------------|-------|
| Thread switcher | Ship | Wired | two-thread smoke | staging pending | 046 |
| Permission modal / abort | Ship | Fixed in review | chat permission tests | unit pass | 045 |
| Propose from correction | Ship | Wired | proposal-store tests + staging | unit pass | 048 |
| Ticket orchestration commands | Ship | Wired | chat-ticket-commands tests | unit pass | 049 |
| Command Station strip (Chat) | Ship | Partial tiles | rev8 proof screenshots | staging pending | 059, 127 strip only |
| Memory writeback gate UI | Ship | Wired when runtime up | memory-store tests | unit pass | 128 |
| Correction → ratification moment | Ship | Partial UX | 123, 126 staging | staging pending | 123, 126 |

---

## Labs features (not always a sidebar row)

| Feature id | Tier | Entry surface | Blocked when | Proof | Owner |
|------------|------|---------------|--------------|-------|-------|
| `knowledge_cognee` | Labs | Knowledge | Sidecar down / disabled | `SHIP_CHECKS/cognee.md` | 041–044 |
| `pgvector_recall` | Labs | Knowledge / Settings | `OTTO_PGVECTOR` off or DB down | pgvector-store tests | 068 |
| `channels_outbound` | Labs | Channels | No live Discord bot | channels contract only | 056 |
| `memory_observatory` | Labs | Settings | Runtime not ready | memory read surface | 047 |
| `worker_autonomous_loop` | Labs | Tickets | Runner not configured | worker loop receipt | 060 |
| `practice_mining` | Labs | Practices / Curation | Observe loop off | practice-mining tests | 061 |
| `culture_export` | Labs | Settings / Command Station | Export path unavailable | culture-export tests | 125 |
| `remote_letta_cloud` | Labs | Settings connection | Cloud creds missing | parked advanced mode | 077 |
| `command_station_full` | Labs | Dedicated dashboard | Not built — strip stays Ship | 127 |
| `turn_phase_timeline` | Labs | Chat turn trail chip | Labs off → span list only | `docs/v1/agent-turn-trail.md` · turn-trail tests | 668 |
| `voice_realtime` | Labs | Settings → Voice & image | Labs off or feature off | voice capture smoke (#510) | 510, **578** |
| `image_gen` | Labs | Settings → Voice & image | Labs off or feature off | image artifact smoke (#511) | 511, **578** |
| `ai_frontier_review_routine` | Labs | Routines | Optional executor | ai-frontier-review-executor tests | 062 |

---

## Cut (no product UI)

| Item | Notes | Ticket |
|------|-------|--------|
| Otto Cloud live stack | Spec only | 083–089 |
| Cathedral control plane | Spec only | 094–099 |
| Paperclip write integration | Private boundary | 021–022 |
| Extension `/ticket` CLI as primary UX | Cut from desktop ship | 130 |

---

## Backends & infra

| Backend | Tier | Ship dependency | Notes |
|---------|------|-----------------|-------|
| Embedded Letta (one-app) | Ship | Yes for zero-setup story | **076** fresh-profile proof open |
| Existing local Letta | Ship | Fallback path | 001 readiness |
| File-backed canon (`standards/`, `~/.otto/`) | Ship | Yes | No mock data in UI |
| Cognee sidecar | Labs | No | Opt-in recall graph |
| pgvector | Labs | No | Env-gated |
| Discord live bot | Labs | No | Approval-gated sends |
| Letta Cloud remote | Labs | No | 077 parked |

---

## Reopen list — Ship-tier gaps (now in `_Backlog/` or root)

These were premie-dones in `_Done/`; moved to **`planning/hq-tickets/_Backlog/`** on 2026-06-14. **138** owns closure before Ship declare.

| Ticket | Gap | Folder |
|--------|-----|--------|
| 032 | Onboarding connect/run gating — partial smoke only | `_Done/` (craft; staging still thin) |
| 069 | Welcome skip when already connected — no staging proof | `_Backlog/` |
| 071 | Sample receipt step — no visual proof | `_Backlog/` |
| 072 | Receipts CTA / dock — staging proof open | `_Backlog/` |
| 073 | Dock layout — visual proof open | `_Backlog/` |
| 076 | Embedded Letta — fresh Mac bundle proof open | `root/` |
| 080 | Depends on **076** for full zero-setup proof | `_Backlog/` |
| 063 | Sebastian gate — checklist evidence + ack open | `_Backlog/` |
| 078 | Provider mirror — live staging proof pending | `_Backlog/` |
| 066 | Skills seed — live staging proof pending | `root/` |
| 068 | pgvector — Labs; staging proof pending | `_Backlog/` |
| 060 | Worker loop — disposable staging proof pending (Labs) | `root/` |
| 064 | Remotion asset — MP4 on release; staging walk optional | `_Done/` |
| 115 | Marketing pricing — live staging proof pending | `_Backlog/` |

---

## Verification bundle (Sebastian gate)

Receipt: [`084-release-gate-verify-20260615.json`](../receipts/staging/084-release-gate-verify-20260615.json) (issue **#84**).

### Automated gates (2026-06-15, `main` @ `38171e8`)

| # | Check | Result |
|---|--------|--------|
| 1 | `bun run verify:v0` | **pass** — 5/5; 392 pass / 0 fail / 2 skip |
| 2 | `bash scripts/release-gate.sh` | **pass** — verify:v0 + electron:typecheck |
| 3 | Labs off default (fresh `~/.otto`) | **pass** — `config-store.test.ts` (**137**) |

### Staging proof checklist (rows 2–10 — Sebastian walk)

Run on **`/Applications/otto-staging.app` only** — never live `otto.app` or `conversation=default`.

| # | Check | Result |
|---|--------|--------|
| 2 | Staging bundle refresh | **pending** — deploy not run this pass |
| 3 | Labs off default (UI) | **pending** — Sebastian walk |
| 4 | Labs on knowledge | **pending** — Sebastian walk |
| 5 | Chat + threads | **pending** — `otto-staging-two-thread-smoke.cjs` |
| 6 | Rev8 culture strip | **pending** — `otto-staging-rev8-proof.cjs` |
| 7 | Embedded bootstrap | **partial** — prior receipt; fresh Mac **076** open |
| 8 | Onboarding smoke | **pending** — runtime required |
| 9 | Culture CI demo | **pending** — **135** |
| 10 | Ticket orchestration | **pending** — `otto-staging-ticket-proof-capture.cjs` |

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh

# Sebastian / staging operator only:
OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-two-thread-smoke.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-onboarding-smoke.cjs
# Culture CI: docs/v1/demo-culture-ci.md
```

Record pass/fail per **Ship** row in this file before Sebastian ack. **138** owns flipping `staging pending` → `staging pass` with dated receipts.

---

## Reviewer gate (136 / #129)

| Check | Status | Notes |
|-------|--------|-------|
| `bun run check:ship-tier-matrix` | pass | Registry ↔ matrix parity; every Ship row names a proof path |
| Independent reviewer +1 | pending | “No Ship row is aspirational without a proof path” — human sign-off after CI green |
| Sebastian ack (approved tiers) | pending | Initials + date in header table |

---

## Related docs

- `docs/v1/labs.md` — Labs UX contract
- `docs/v1/runbooks/sebastian-release-sign-off.md` — Sebastian gate ceremony (**142**)
- `RELEASE_CHECKLIST.md` — release cut policy (`0.1.x` earned bumps); standard: `standards/standards/earned-semver.md`
- `planning/hq-tickets/136-ship-tier-matrix-audit.md` — ticket AC
- `apps/desktop/src/surface-tiers.ts` — tier registry + nav gating (**137**)
