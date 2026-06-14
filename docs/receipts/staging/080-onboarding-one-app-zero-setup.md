# Staging receipt — 080 Onboarding one-app zero-setup (copy + walkthrough)

Date: 2026-06-14  
Staging app: `/Applications/otto-staging.app`  
Isolated `OTTO_HOME`: `$HOME/.codex/admin/otto-staging/otto-home`

## Scope (honest)

This receipt covers **copy/narrative ACs** for 080. Embedded runtime proof without external Letta remains on **076** (`_Done` rev5).

## Fresh profile walkthrough

```sh
cd /Users/seb/Code/otto
bash apps/desktop/scripts/deploy-staging.sh

NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-onboarding-smoke.cjs
```

Latest run: `onboarding-smoke-20260614062759.json`

## Checked

| AC | Result |
|----|--------|
| Primary copy — no “install Letta” in main steps | Pass — `Onboarding.tsx` one-app wording |
| Receipt step sample (071) | Pass — `071-072-receipts-sample-onboarding.png` |
| Advanced path labeled → Settings / 076 modes | Pass — “Advanced: existing Letta install” |
| Embedded bootstrap without external install | **Blocked on 076** — not claimed here |

## Screenshots

- `069-connected-first-state.png` — welcome when runtime ready
- `071-072-receipts-sample-onboarding.png` — sample proof record on receipts-preview path
- `072-primary-connect-dock.png` — primary Get started → connect dock
- `073-narrow-dock-layout.png` — 880px composer visible after Skip

## Verification

```sh
bun test apps/desktop/electron/onboarding-*.test.ts
bun run verify:v0
```

## Link to 076

See `planning/hq-tickets/_Done/076-embedded-letta-one-app-distribution.md` for bundled CLI / staging smoke gaps.
