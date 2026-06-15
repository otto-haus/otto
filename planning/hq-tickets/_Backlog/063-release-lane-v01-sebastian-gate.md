# 063 — Release Lane v0.1.3 (Sebastian Gate)

Owner: Cursor + Claude
Priority: P1
Depends on: 033–038, 045, 048, 054, 055, 056, 051, **136–137**
Release bucket: **v0.1.3** functional ship (not v0.3.0 semver)

## Outcome

Otto **v0.1.3** is ready for Sebastian approval: Ship tier honest, Labs gated, staging proof recorded — **no push/tag until explicit approval**.

## Why this matters

Integration branch `ship/v0.3-integration` is a codename, not semver. The earned release line is **0.1.x**; first gate tag target is **v0.1.3** after Ship/Labs matrix + staging walk.

## Scope

- Refresh `RELEASE_CHECKLIST.md`, `docs/v1/SHIP_STATUS.md`, `docs/v1/ship-tier-matrix.md` vs reality
- Staging-only proof on `/Applications/otto-staging.app` (never live `otto.app`)
- Prepare tag message + GitHub metadata (do not push)
- Sebastian checklist with pass/fail per Ship row

## Out of scope

- Publishing without Sebastian sign-off
- npm publish
- GitHub release/tag creation
- Touching `/Applications/otto.app`

## Done when

- [ ] `docs/v1/ship-tier-matrix.md` Sebastian ack recorded (date + initials)
- [ ] Every **Ship** row has staging pass/fail recorded (not aspirational)
- [ ] Labs default off verified on fresh `~/.otto/config.json` (**137**)
- [ ] `bun run verify:v0` green
- [ ] Remote `CI / checks` green on release PR (ticket **129** / `.github/workflows/ci.yml`)
- [ ] `bash scripts/release-gate.sh` green
- [ ] Staging deploy receipt: `OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh`
- [ ] Explicit **NOT PUSHED** banner until Sebastian approval

## Staging proof checklist (v0.1.3)

Run only against **`/Applications/otto-staging.app`**. Record pass/fail in matrix + this ticket.

| # | Check | Command / action | Pass |
|---|--------|------------------|------|
| 1 | Unit + type gate | `bun run verify:v0` && `bash scripts/release-gate.sh` | |
| 2 | Staging bundle refresh | `OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh` | |
| 3 | Labs off default | Fresh profile → Settings → Labs master **off**; Knowledge nav **coming soon** | |
| 4 | Labs on knowledge | Enable Labs + `knowledge_cognee` → Knowledge pane opens (may show blocked inside) | |
| 5 | Chat + threads | `node scripts/otto-staging-two-thread-smoke.cjs` (runtime required) | |
| 6 | Rev8 culture strip | `node scripts/otto-staging-rev8-proof.cjs` | |
| 7 | Embedded bootstrap | `node scripts/otto-staging-076-bootstrap-proof.cjs` | |
| 8 | Onboarding smoke | `node scripts/otto-staging-onboarding-smoke.cjs` (when Letta connected) | |
| 9 | Culture CI demo | Walk `docs/v1/demo-culture-ci.md` (**135**) | |
| 10 | Ticket orchestration | `node scripts/otto-staging-ticket-proof-capture.cjs` | |

**Honest gaps (do not fake pass):** 076 fresh Mac bundle, onboarding dock/receipt visuals (071–073), provider mirror live proof (078), embedded Letta on clean machine.

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
gh pr checks <release-pr> --watch   # CI / checks must be green before Sebastian gate
bash scripts/release-gate.sh

OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh

NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-two-thread-smoke.cjs
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs
```

## Blocker log

Leave blank unless blocked.

## Status banner

```txt
NOT PUSHED — v0.1.3 gate open. Staging proof checklist rows 3–10 pending Sebastian walk.
```
