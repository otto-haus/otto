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
| **Matrix date** | 2026-06-14 |
| **Branch** | `ship/functional-labs` (integration codename — not semver) |
| **Sebastian ack** | *Pending* — tiers below are implementer-validated; Sebastian initials required before declare |

**Nav policy (decided):** Labs-tier sidebar items stay **visible** with a neutral `coming soon` badge when disabled — honest product, no hidden debt.

**Changelog**

| Date | Change |
|------|--------|
| 2026-06-14 | **137** Labs gate: master + feature toggles; Knowledge/Channels Labs-tier only |
| 2026-06-14 | Initial matrix from ticket 136 + staging walk |

---

## Sidebar surfaces

| Surface | Tier | Current state | Labs default today | Proof command / path | Owner |
|---------|------|---------------|-------------------|----------------------|-------|
| Chat | Ship | Wired; needs live Letta for send | always on | `node scripts/otto-staging-two-thread-smoke.cjs` (disposable conv) | 002, 046 |
| Settings | Ship | Wired | always on | Settings readiness rows + `bun test apps/desktop/electron/config-store.test.ts` | 001, 076 |
| Onboarding | Ship | Partial — dock/receipt gaps | n/a | `node scripts/otto-staging-onboarding-smoke.cjs` (runtime required) | 080, 071–073 |
| Charters | Ship | File-backed pane | preview (Labs off) | Open `~/.otto/charters/` + pane list | 007 |
| Standards | Ship | File-backed | shipped | `standards/` load + skipped visible (037) | 008, 009 |
| Practices | Ship | File-backed | preview | `practices/**/practice.yaml` + pane | 010, 011 |
| Routines | Ship | File-backed | preview | `routines/` + manual run receipt | 012, 013 |
| Curation | Ship | Proposal queue | shipped | deferred filter smoke (036) | 014–016, 048 |
| Receipts | Ship | File read | shipped | `~/.otto/receipts/` + pane detail | 004, 005, 124 |
| Checks | Ship | Culture CI pane + Chat block | preview | `docs/v1/demo-culture-ci.md` + **135** demo | 131–135 |
| Autonomy | Ship | Policy read/evaluate | shipped | `autonomy/policy.yaml` + evaluate receipt | 017 |
| Skills | Ship | SkillStore | shipped | `skill/**/SKILL.md` browse | 066 |
| Knowledge | Labs | Registry file-backed; Cognee optional | **coming soon** (Labs off) | Registry read; enable `knowledge_cognee` in Settings → Labs | 040–044, 055, **137** |
| Tickets | Ship | Compile/orchestrate | shipped | `node scripts/otto-staging-ticket-proof-capture.cjs` | 049 |
| Channels | Labs | Contract + config; no live bot | **coming soon** (Labs off) | Enable `channels_outbound` in Settings → Labs | 056, **137** |

---

## Chat sub-flows

| Flow | Tier | Current state | Proof | Owner |
|------|------|---------------|-------|-------|
| Thread switcher | Ship | Wired | two-thread smoke | 046 |
| Permission modal / abort | Ship | Fixed in review | chat permission tests | 045 |
| Propose from correction | Ship | Wired | proposal-store tests + staging | 048 |
| Ticket orchestration commands | Ship | Wired | chat-ticket-commands tests | 049 |
| Command Station strip (Chat) | Ship | Partial tiles | rev8 proof screenshots | 059, 127 strip only |
| Memory writeback gate UI | Ship | Wired when runtime up | memory-store tests | 128 |
| Correction → ratification moment | Ship | Partial UX | 123, 126 staging | 123, 126 |

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

Run on **`/Applications/otto-staging.app` only** — never live `otto.app` or `conversation=default`.

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh

OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh

NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-two-thread-smoke.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs

# When Letta runtime connected:
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-onboarding-smoke.cjs
# Culture CI demo: docs/v1/demo-culture-ci.md
```

Record pass/fail per **Ship** row in this file before Sebastian ack.

---

## Related docs

- `docs/v1/labs.md` — Labs UX contract
- `RELEASE_CHECKLIST.md` — release cut policy (`0.1.x` earned bumps); standard: `standards/standards/earned-semver.md`
- `planning/hq-tickets/136-ship-tier-matrix-audit.md` — ticket AC
- `apps/desktop/src/surface-tiers.ts` — tier registry + nav gating (**137**)
