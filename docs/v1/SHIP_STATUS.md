# Otto v1 — Ship Status

Updated: 2026-06-14 (tickets **140** / **142**)

Integration branch: `ship/functional-labs` (codename — not product semver)

**Product line:** **`v0.1.x`** — target tag **`v0.1.3`** (pre-release until Sebastian gate).
**Staging proof:** `/Applications/otto-staging.app` only — live app unchanged.

```txt
NOT PUSHED — no main merge, no tag, no live app promotion until Sebastian sign-off.
```

Tier truth: [`docs/v1/ship-tier-matrix.md`](ship-tier-matrix.md) · Release tables: [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md) · Ceremony: [`docs/v1/runbooks/sebastian-release-sign-off.md`](runbooks/sebastian-release-sign-off.md)

HQ conveyor: `planning/hq-tickets/` — **138** core-path proof still in root (staging gaps logged). **139** Labs shells in `_Done/`.

Shared verification (2026-06-14, **140**):

```sh
cd /Users/seb/Code/otto
bun run verify:v0          # 5/5, 208 unit tests
bash scripts/release-gate.sh
```

## Ship tier (Labs off)

Public claims must match this table only. Full matrix: [`ship-tier-matrix.md`](ship-tier-matrix.md).

| Surface | Staging | Gap |
|---------|:-------:|-----|
| Chat, Settings, Onboarding | partial | real turn + onboarding dock visuals (**071–073**) |
| Charters, Standards, Practices, Routines | pass (hygiene) | live walk optional |
| Curation, Receipts, Checks, Autonomy, Skills, Tickets | pass (hygiene/unit) | Culture CI demo **135** not re-run session |
| Knowledge, Channels | n/a (Labs) | coming soon when Labs off — **137** |

**138** receipt bundle: [`staging-hygiene-proof-20260614143512.json`](../receipts/staging/staging-hygiene-proof-20260614143512.json) — not full Ship declare.

## Labs tier

Default **off**. [`docs/v1/labs.md`](labs.md). **139** receipt: [`124-126-123-139-ui-wedge-20260614.md`](../receipts/staging/124-126-123-139-ui-wedge-20260614.md).

| Feature | Public claim |
|---------|--------------|
| Cognee / pgvector / Channels / worker loop / Cloud | **Not shipped** — Labs or Cut |

## Cut

Otto Cloud live stack, Paperclip write, extension `/ticket` as primary UX — spec/parked only.

## Lane completion (historical smoke)

| Lane | Surface | Status | Primary smoke |
|---:|---|---|---|
| 001 | Chat | done | `otto-002-chat-send-smoke-20260614T023917Z.json` |
| 002 | Settings + Letta | done | `otto-001-connected-settings-smoke-20260614T023015Z.json` |
| 003 | Receipts | done | `otto-004-receipt-smoke-20260614T032125Z.json` |
| 004–009 | Canon surfaces | done | lane receipts under smoke root |

Mapping: `planning/lane-tickets/000-hq-sync.md`

Detail per surface: `docs/v1/SHIP_CHECKS/*.md` · PR split: `docs/v1/runbooks/pr-stack-ship-v03.md`

## Not shipped (honest)

- Live Discord bot, Otto Cloud sync, always-on cloud
- Public push / tag / npm publish (**NOT PUSHED**)
- Live `/Applications/otto.app` — staging worktree only
- **076** fresh-Mac embedded Letta proof
- Culture CI end-to-end demo on staging (**135**) — pending re-run

## Next

1. Close **138** Ship core-path gaps with dated staging receipts
2. Sebastian runs [`sebastian-release-sign-off.md`](runbooks/sebastian-release-sign-off.md) (**142**)
3. Record verdict in [`063-sebastian-gate-packet-v03-20260614.md`](../receipts/staging/063-sebastian-gate-packet-v03-20260614.md)
