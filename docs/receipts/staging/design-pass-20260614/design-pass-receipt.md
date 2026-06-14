# Design pass receipt — staging only (closure)

Date: 2026-06-14  
Branch: `ship/functional-labs` @ `5710c76` (local WIP on ConnectLetta copy)  
App: `/Applications/otto-staging.app`  
Verify: `bun run verify:v0` — **5/5 pass** (214 unit tests, second run after flaky OTTO_HOME isolation)

## Scope (this closure)

Phases 1–3 from the brand-canon design pass were already landed on `ship/functional-labs` (2026-06-13 receipt). This closure finishes the remaining operator-facing gap:

- **Settings → Connection** — connected status line no longer shows raw `agentId`; matches readiness banner (`Connected — live Letta session · model · transport`).
- **Copy bundle** — ConnectLetta override labels, placeholders, save/busy strings moved to `settingsCopy` in `copy/surfaces.ts`.

## Already verified on branch (unchanged this session)

| Check | Status |
|-------|--------|
| Slim topbar (eyebrow + source pill) | pass |
| Single `SurfaceProof` footer per surface | pass |
| oklch token sync in `styles.css` | pass |
| Settings `SurfacePage` + hero stack | pass |
| Sidebar profile: model / Letta session, not agent id | pass |
| Onboarding dock clears prompt (`bottom: 120px`, `z-index: 90`) | pass |
| Charters create above split | pass |

## Manual verify

1. Quit live **otto** if open.
2. Open `/Applications/otto-staging.app` (rebuilt 2026-06-14).
3. Walk 14 routes: Chat, 4 Behavior, 3 Governance, 4 System, Settings.
4. Settings → General → Connection: after connect, status shows session copy + model/transport only (agent id remains in advanced override field only).

## Automated capture

Full-route screenshot bundle still **pending** (CDP nav timeout in prior runs). Optional:

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging/design-pass-20260614 \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-proof-capture.cjs
```

## Deferred (out of scope)

- P2 detail refactors (~68 legacy `.panel` blocks in detail views)
- Live `/Applications/otto.app` promotion
- v0.1.3 merge to `main` / new tag

Prior pass: [`design-pass-20260613/design-pass-receipt.md`](../design-pass-20260613/design-pass-receipt.md)
