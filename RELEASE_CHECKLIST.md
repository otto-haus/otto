# Otto v0.1 — Release Checklist

**This file is the source of truth for shipped status.** A feature is **Shipped** only when
it is Built, Tested (or failure documented), Demoed, Tried by Sebastian, and **explicitly
approved by Sebastian**. Claude is execution lead; Sebastian is the only release approver.

**NOT PUSHED to main / live app** — integration branch `ship/functional-labs` @ `0a07320` (integration codename — **not** product semver).
**Product line:** **`v0.1.x`** — **`v0.1.3`** tags the integration/demo line (GitHub pre-release). Mistaken tags `v0.2.0`, `v0.2.1`, `v0.3.0` removed locally; do not treat integration branch names as public semver.
Mirror: `docs/v1/SHIP_STATUS.md`. Gate packet: `docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md`.

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

## Release table

| Feature | Built | Tested | Demo | v0.1 | Notes |
|---|:--:|:--:|:--:|:--:|---|
| Practices | ✅ | ✅ | ✅ | **ship** | loader/validator/CLI; real `practices.json` on desktop |
| Skills | ✅ | manual | ✅ | **ship** | charter + routine skill packages + SkillStore pane |
| Charter | ✅ | manual | ✅ | proposed | permission gates live; AC auditing manual |
| Routines | ✅ | manual | ✅ | proposed | specs + manual trials; recurring scheduler deferred |
| Standards | ✅ | manual | ✅ | proposed | canon + precedents; enforcement via review |
| Desktop | ✅ | build ✅ | ✅ | proposed | Electron shell; Letta path wired; live chat gated |
| Curation | ✅ | unit | — | proposed | proposals + decide in desktop; not full spine |
| Autonomy | ✅ | unit | ✅ | defer | policy.yaml + classifier + receipts |
| Knowledge | ✅ | unit | — | **reopened (055)** | parent ticket returned to root — staging proof pending |
| Runs / Receipts | ✅ | unit | — | defer | types + file receipts; no full run engine |
| Approvals | ✅ | unit | — | defer | records from Curation path |
| Tickets | ✅ | unit | — | **reopened (049)** | orchestrate path not proven on staging |
| Worker orchestration | ✅ | unit | — | **reopened (060)** | observe loop incomplete |
| Channels | ✅ | files | — | **reopened (056)** | SHIP_CHECK vs ticket mismatch |
| Marketing site | ✅ | manual | — | **preview** | `site/` local staging verified; apex DNS pending |
| Release gate | ✅ | ✅ | — | **in progress** | **063** open; **142** ceremony queued |

Legend: ✅ done · `manual` = manually verifiable · v0.1 = ship / proposed / defer · Tried + Approved = Sebastian only.

## Test receipts (this machine, bun 1.3.14)

```sh
cd /Users/seb/Code/otto
bun run verify:v0                        # 5/5 — typecheck, bun test, practices, desktop typecheck, rename sweep
bash scripts/release-gate.sh           # verify:v0 + apps/desktop electron:typecheck
```

Latest unit suite (2026-06-13):

```
bun test                               → 151 pass / 0 fail
bun run typecheck                      → exit 0
bun run --cwd apps/desktop typecheck   → exit 0
bun run --cwd apps/desktop electron:typecheck → exit 0 (via release-gate.sh)
```

Per-feature receipts: [`receipts/otto-v01/`](receipts/otto-v01/). Demos: [`demo/README.md`](demo/README.md).
Staging smoke: `docs/receipts/staging/`. PR stack: `docs/v1/runbooks/pr-stack-ship-v03.md`.

## Rename / packaging sweep

- `Vinny OS` / `Vinny` → `Otto`; `cockpit` → `workspace`; old private repo target → `otto-haus/otto`.
- Packages: `@vinny-os/*` → `@otto-haus/*`; root → `otto`; bin `vinny-practices` → `otto-practices`.
- `bun run verify:v0` enforces no old product-name hits in tracked files; `VINNY_*` env tokens are allowed back-compat fallbacks.

## Compatibility notes

- **Env vars:** `OTTO_HOME` preferred, `VINNY_HOME` fallback; `OTTO_ROOT` preferred, `VINNY_OS_ROOT` fallback.
- **Cognee:** `OTTO_COGNEE_ENABLED`, `OTTO_COGNEE_BASE_URL` — also in Settings → General (persisted to `~/.otto/config.json`).
- **Namespace target:** `otto-haus` (provisional) — confirm before push.

## Open issues / honest gaps

- Demos: desktop walkthrough re-rendered 2026-06-14 → `demo/out/otto-v01-desktop-walkthrough.mp4` (receipt `receipts/otto-v01/demo-render-20260614T063531Z.md`); other clips: `bash scripts/render-demo-clips.sh all`.
- Marketing site: local staging only (`bash site/deploy-staging.sh`); `otto.haus` apex not deployed.
- Live `/Applications/otto.app` may lag integration branch; staging app is the proof target.
- Cognee/pgvector recall require local daemons — UI shows honest empty when off.
- Sebastian checklist (Tried + Approved) all pending.

## Final gate — Sebastian approves before any push/tag

| Item | Approved? |
|---|:--:|
| README public story | ☐ |
| Feature shipped table (this file) | ☐ |
| Demo videos / walkthrough refresh | ☐ |
| Test receipts (`verify:v0` green) | ☐ |
| Namespace `otto-haus` / `@otto-haus` | ☐ |
| **Push + tag `v0.1.3`** (Red — explicit) | ☐ |
