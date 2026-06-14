# 063 — Sebastian gate packet (v0.1.3 draft — hold)

Date: 2026-06-14 (updated 14:45 local)  
Branch: `ship/functional-labs` @ `b8ed206`  
Tag: **`v0.1.3`** pre-release on **otto-haus/otto** with asset `otto-v01-desktop.mp4` — **not Latest / not Shipped** until Sebastian approves.

## What to try (staging only)

1. Open `/Applications/otto-staging.app` — title must read **otto staging**.
2. Chat: clean header, model/effort **above** compose, custom send icon, no cli/MemFS footer.
3. Skim System surfaces (Standards, Curation, Tickets, Checks) for culture CI banner.
4. Watch demo: `demo/out/otto-v01-desktop-walkthrough.mp4` (local) — GitHub release assets deferred until **`v0.1.3`** approval

## Verification receipts

| Gate | Result |
|------|--------|
| `bun run verify:v0` | 5/5 pass (208 unit tests) @ 2026-06-14 |
| `bash scripts/release-gate.sh` | pass @ 2026-06-14 (verify:v0 + electron:typecheck) |
| Staging deploy | `OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh` — `/Applications/otto-staging.app`, CDP **9445**, profile `~/.codex/admin/otto-staging/profile` |
| Hygiene staging proof | `scripts/otto-staging-hygiene-proof.cjs` → `staging-hygiene-proof-20260614143512.json` (054–058, 049, 053 all `ok: true`) |
| Craft checklist | `docs/receipts/staging/craft-checklist-v03-20260614.md` |
| Remotion | Local MP4 + https://github.com/otto-haus/otto/releases/tag/v0.1.3 (`otto-v01-desktop.mp4`, pre-release) |

### Staging smoke commands (138 / hygiene)

```sh
cd /Users/seb/Code/otto
OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh

# Hygiene tickets 049, 053–058 (requires CDP 9445 + isolated staging profile)
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-hygiene-proof.cjs

# Core path (138 — run when Letta available; not all re-run this session)
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs
NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-rev8-proof.cjs
NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-two-thread-smoke.cjs
NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-076-bootstrap-proof.cjs
# Culture CI: docs/v1/demo-culture-ci.md
```

## Honest gaps (not hidden)

- Live `/Applications/otto.app` still shows legacy chrome — **by design** until you approve promotion.
- Cognee/pgvector recall needs local daemons — UI shows empty when off.
- Marketing apex `otto.haus` DNS deploy still pending (`site/deploy-staging.sh` local only).
- WS transport default remains SDK; WS behind env flag (039 scorecard on branch).
- HQ `_Done/` may include tickets without full staging proof — see `planning/hq-tickets/000-audit-status.md`.

## Decisions needed from Sebastian

1. **Approve** integration merge to `main`? (PR stack runbook: `docs/v1/runbooks/pr-stack-ship-v03.md`)
2. **Approve** tag **`v0.1.3`** on otto-haus/otto as public release line? (draft — not tagged yet)
3. **Approve** promoting same build to live `/Applications/otto.app`? (default: **no** — staging-only proof)

Reply with approve/deny per item. Otto does not self-declare Shipped.

## Ceremony (142)

Runbook: [`docs/v1/runbooks/sebastian-release-sign-off.md`](../v1/runbooks/sebastian-release-sign-off.md)

- Approval template: [`sebastian-release-approval-template.md`](sebastian-release-approval-template.md)
- Dry-run example (not signed): [`sebastian-release-approval-dry-run-v013-20260614.md`](sebastian-release-approval-dry-run-v013-20260614.md)

Append Sebastian verdict block here when signed.
