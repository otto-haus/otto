# 063 — Sebastian gate packet (v0.3.0 integration)

Date: 2026-06-14  
Branch: `ship/v0.3-integration` @ `0a07320`  
**NOT production-shipped** until you explicitly approve tag/merge/live deploy.

## What to try (staging only)

1. Open `/Applications/otto-staging.app` — title must read **otto staging**.
2. Chat: clean header, model/effort **above** compose, custom send icon, no cli/MemFS footer.
3. Skim System surfaces (Standards, Curation, Tickets, Checks) for culture CI banner.
4. Watch demo: https://github.com/otto-haus/otto/releases/tag/v0.3.0

## Verification receipts

| Gate | Result |
|------|--------|
| `bun run verify:v0` | 5/5 pass (163 unit tests) |
| `bash scripts/release-gate.sh` | pass |
| Staging deploy | `bash apps/desktop/scripts/deploy-staging.sh` @ 0a07320 |
| Craft checklist | `docs/receipts/staging/craft-checklist-v03-20260614.md` |
| Remotion | `otto-v01-desktop-walkthrough.mp4` + `otto-v01-desktop.mp4` on otto-haus v0.3.0 |

## Honest gaps (not hidden)

- Live `/Applications/otto.app` still shows legacy chrome — **by design** until you approve promotion.
- Cognee/pgvector recall needs local daemons — UI shows empty when off.
- Marketing apex `otto.haus` DNS deploy still pending (`site/deploy-staging.sh` local only).
- WS transport default remains SDK; WS behind env flag (039 scorecard on branch).
- HQ `_Done/` may include tickets without full staging proof — see `planning/hq-tickets/000-audit-status.md`.

## Decisions needed from Sebastian

1. **Approve** integration merge to `main`? (PR stack runbook: `docs/v1/runbooks/pr-stack-ship-v03.md`)
2. **Approve** tag `v0.3.0` on otto-haus/otto as public release line?
3. **Approve** promoting same build to live `/Applications/otto.app`? (default: **no** — staging-only proof)

Reply with approve/deny per item. Otto does not self-declare Shipped.
