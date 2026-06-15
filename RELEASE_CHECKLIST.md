# Otto v0.1 — Release Checklist

**This file is the source of truth for shipped status.** A feature is **Shipped** only when
it is Built, Tested (or failure documented), Demoed, Tried by Sebastian, and **explicitly
approved by Sebastian**. Claude is execution lead; Sebastian is the only release approver.

**NOT PUSHED to main / live app** — integration branch `ship/functional-labs` (integration codename — **not** product semver).
**Product line:** **`v0.1.x`** — **`v0.1.3`** tags the integration/demo line (GitHub pre-release). Mistaken tags `v0.2.0`, `v0.2.1`, `v0.3.0` removed locally; do not treat integration branch names as public semver.
Mirror: `docs/v1/SHIP_STATUS.md`. Tier matrix: [`docs/v1/ship-tier-matrix.md`](docs/v1/ship-tier-matrix.md).
Gate packet: [`docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md`](docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md).
Sign-off ceremony: [`docs/v1/runbooks/sebastian-release-sign-off.md`](docs/v1/runbooks/sebastian-release-sign-off.md) (**142**).

```txt
NOT PUSHED — v0.1.3 gate open. No merge to main. No tag. No live /Applications/otto.app.
Target tag v0.1.3 is prepared only until Sebastian explicit approval (receipt required).
```

## Release cut policy

**Standard:** [`standards/standards/earned-semver.md`](standards/standards/earned-semver.md) (canon) · anti-pattern: [`standards/anti-patterns/semver-inflation.md`](standards/anti-patterns/semver-inflation.md)

**Floor:** `0.1.x` is the lowest honest public line. We are on it. Version numbers are **earned**, not branch names.

| Bump | When | Example |
|------|------|---------|
| **Patch** `0.1.n → 0.1.n+1` | Sebastian gate after a **closed proof bundle**: Ship-tier matrix signed, staging smokes green, RELEASE_CHECKLIST rows updated, no aspirational rows marked ship | First public cut → `v0.1.3` |
| **Minor** `0.1.x → 0.2.0` | A **named milestone** ships and is documented in `ship-tier-matrix.md` changelog — not “we merged a big branch” | e.g. Labs lane stable (Coming soon + gate) with fresh-Mac embedded Letta proof |
| **Major** `→ 1.0.0` | Default operator completes the **Ship-tier loop** without Sebastian hand-holding | future |

Integration branch names (`ship/functional-labs`) and orphan draft tags (`v0.3.0`) are **engineering labels**. Public semver stays on `0.1.x` until a minor milestone is earned.

## v0.1 honesty framing

Otto v0.1 is a **local-first workspace shell** with file-backed governance surfaces. **Nothing
ships to production without Sebastian sign-off.** Curation proposal/ratification exists in the
desktop lane (016) but is not the full product spine. The `/ticket` Letta extension CLI remains
deferred (130). **Desktop Electron + Letta bridge is implemented** (`apps/desktop`) but **live
chat requires** a successful `session.initialize()` against a configured agent — nothing claims
"connected" until that succeeds. Per-surface evidence: [`SPEC_COMPLIANCE.md`](SPEC_COMPLIANCE.md),
[`SHIP_CHECKS/`](SHIP_CHECKS/), [`CLAIMS_AUDIT.md`](CLAIMS_AUDIT.md).

## Ship tier (Labs off — public claims)

Works end-to-end without Labs. Source matrix: [`docs/v1/ship-tier-matrix.md`](docs/v1/ship-tier-matrix.md).

| Surface / flow | Staging proof | Receipt / link | Sebastian tried |
|----------------|---------------|----------------|:-----------------:|
| Chat + threads | partial | unit + hygiene; two-thread smoke **not re-run 2026-06-14** | ☐ |
| Settings + readiness | pass | `otto-001-connected-settings-smoke-*.json` | ☐ |
| Onboarding | partial | onboarding smoke exists; dock visuals **071–073 open** | ☐ |
| Charters, Standards, Practices, Routines | pass (hygiene) | `staging-hygiene-proof-20260614143512.json` | ☐ |
| Curation + ratification | pass (unit + hygiene) | proposal-store tests; **123/126/048** | ☐ |
| Receipts | pass | hygiene 124; `otto-004-receipt-smoke-*.json` | ☐ |
| Checks (Culture CI) | partial | seed checks + unit; **135 demo not re-run** | ☐ |
| Autonomy | pass | policy tests + `otto-017-autonomy-policy-smoke-*.json` | ☐ |
| Skills | pass (file) | SkillStore tests; live staging **066 open** | ☐ |
| Tickets compile/orchestrate | pass (hygiene) | `staging-hygiene-proof-20260614143512.json` (049) | ☐ |
| Embedded Letta bootstrap | partial | prior `staging-076-bootstrap-proof-*.json`; **fresh Mac open** | ☐ |
| Desktop shell / craft | pass (staging) | `craft-checklist-v03-20260614.md`, rev8 hygiene | ☐ |

**138** core-path ticket (still in root): [`planning/hq-tickets/138-ship-tier-core-path-proof.md`](planning/hq-tickets/138-ship-tier-core-path-proof.md) — staging log lists gaps honestly; do not mark Ship declare until **138** Done-when met.

## Labs tier (Settings → Labs)

Experimental; enable per feature. UX: [`docs/v1/labs.md`](docs/v1/labs.md). **139** receipt: [`docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md`](docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md).

| Feature / surface | Default (Labs off) | Proof | Shipped claim |
|-------------------|-------------------|-------|---------------|
| Knowledge (+ Cognee) | coming soon | registry tests; Cognee optional | **no** — Labs only |
| Channels (Discord) | coming soon | file contract; **no live bot** | **no** — Labs only |
| pgvector recall | off | unit tests | **no** |
| Worker autonomous loop | off | bounded runner stub | **no** |
| Letta Cloud remote | off | parked **077** | **no** |
| Otto Cloud live stack | — | spec only | **no** (Cut) |

**Not public v0.1 claims:** Discord bot runtime, cloud sync, always-on cloud, Paperclip write integration.

## Cut (no product UI)

| Item | Notes |
|------|-------|
| Otto Cloud live stack | Spec **083–089** |
| Cathedral control plane | Spec **094–099** |
| Paperclip write integration | Private boundary **021–022** |
| Extension `/ticket` CLI as primary UX | **130** |

## Legacy feature rollup (engineering)

| Feature | Built | Tested | Demo | Tier | Notes |
|---|:--:|:--:|:--:|:---:|---|
| Practices | ✅ | ✅ | ✅ | Ship | loader/validator/CLI |
| Skills | ✅ | manual | ✅ | Ship | SkillStore pane |
| Charter / Routines / Standards | ✅ | manual | ✅ | Ship | file-backed; preview badges when Labs off |
| Desktop | ✅ | build ✅ | ✅ | Ship | staging proof target |
| Curation / Receipts / Checks | ✅ | unit | partial | Ship | Culture CI demo **135** open |
| Autonomy / Tickets | ✅ | unit | partial | Ship | hygiene 049; worker loop Labs |
| Knowledge / Channels | ✅ | unit | — | Labs | **137** gate |
| Marketing site | ✅ | manual | — | live | Pages + otto.haus + www.otto.haus |
| Release gate | ✅ | ✅ | — | in progress | **063** + **142** ceremony |

Legend: Tried + Approved = Sebastian only.

## Test receipts (this machine, bun 1.3.14)

```sh
cd /Users/seb/Code/otto
bun run verify:v0                        # 5/5 — typecheck, bun test, practices, desktop typecheck, rename sweep
bash scripts/release-gate.sh           # verify:v0 + apps/desktop electron:typecheck
```

Latest unit suite (2026-06-14, ticket **140** refresh):

```
bun run verify:v0                      → 5/5 pass
bash scripts/release-gate.sh         → pass (verify:v0 + electron:typecheck)
bun test                               → 208 pass / 0 fail (1 skip)
```

Per-feature receipts: [`receipts/otto-v01/`](receipts/otto-v01/). Demos: [`demo/README.md`](demo/README.md).
Staging smoke: `docs/receipts/staging/`. PR stack: `docs/v1/runbooks/pr-stack-ship-v03.md`.
Live install + rollback runbook: [`docs/v1/runbooks/live-vs-staging.md`](docs/v1/runbooks/live-vs-staging.md) (Tier 3 + rollback section).

## Rename / packaging sweep

- `Vinny OS` / `Vinny` → `Otto`; `cockpit` → `workspace`; old private repo target → `otto-haus/otto`.
- Packages: `@vinny-os/*` → `@otto-haus/*`; root → `otto`; bin `vinny-practices` → `otto-practices`.
- `bun run verify:v0` enforces no old product-name hits in tracked files; `VINNY_*` env tokens are allowed back-compat fallbacks.

## Compatibility notes

- **Env vars:** `OTTO_HOME` preferred, `VINNY_HOME` fallback; `OTTO_ROOT` preferred, `VINNY_OS_ROOT` fallback.
- **Cognee:** `OTTO_COGNEE_ENABLED`, `OTTO_COGNEE_BASE_URL` — also in Settings → General (persisted to `~/.otto/config.json`).
- **Namespace target:** `otto-haus` (provisional) — confirm before push.

## Open issues / honest gaps

- **138** Ship core path: onboarding/rev8/two-thread/Culture CI not all re-run 2026-06-14 session — see ticket staging log.
- **076** fresh-Mac embedded Letta bundle proof still open.
- Demos: walkthrough `demo/out/otto-v01-desktop-walkthrough.mp4` + release asset naming `otto-v01-desktop.mp4` (receipt `receipts/otto-v01/demo-render-20260614T063531Z.md`).
- Marketing site: **Pages production** at `https://otto-haus.pages.dev`; apex `https://otto.haus` + `https://www.otto.haus` on Pages project `otto-haus` (verify: `bash site/verify-domains.sh`).
- Live `/Applications/otto.app` lags staging by design until Sebastian approves promotion.
- Cognee/pgvector require local daemons — UI shows honest empty/blocked when off.
- Sebastian checklist (Tried + Approved) all pending.

## Final gate — Sebastian approves before any push/tag

Ceremony: [`docs/v1/runbooks/sebastian-release-sign-off.md`](docs/v1/runbooks/sebastian-release-sign-off.md). Template: [`docs/receipts/staging/sebastian-release-approval-template.md`](docs/receipts/staging/sebastian-release-approval-template.md).

| Item | Approved? |
|---|:--:|
| Tried staging with **Labs off** — core loop | ☐ |
| Tried staging with **Labs on** — one lab feature | ☐ |
| Ship table matches experience | ☐ |
| README public story (Ship tier only) | ☐ |
| Demo videos / walkthrough | ☐ |
| Test receipts (`verify:v0` + `release-gate.sh` green) | ☐ |
| Rollback path documented + `OTTO_RELEASE_TAG` smoke exercised on staging tag | ☐ |
| Namespace `otto-haus` / `@otto-haus` | ☐ |
| **Push + tag `v0.1.3`** (explicit — Red until signed) | ☐ |

```txt
NOT PUSHED until the row above is checked and approval receipt signed.
```
