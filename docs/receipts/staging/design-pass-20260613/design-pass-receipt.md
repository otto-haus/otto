# Design pass receipt — staging only

Date: 2026-06-13  
Branch: `fix/windows-install` (local)  
App: `/Applications/otto-staging.app`  
Verify: `bun run verify:v0` — **5/5 pass** (195 unit tests)

## Scope delivered

### Global shell

- **Slim topbar** — eyebrow + source pill only; page titles live in `SurfaceHero` ([`App.tsx`](../../../../apps/desktop/src/App.tsx), [`styles.css`](../../../../apps/desktop/src/styles.css)).
- **Single “The test:”** — removed duplicate `SurfaceProof` from all `SurfaceHero` instances; one footer proof per surface.
- **Token sync** — `:root` ink/status and warm paper grounds aligned to brand guide oklch values.

### Chat

- **Command Station** — `CommandStationStrip` wired when runtime is ready ([`Chat.tsx`](../../../../apps/desktop/src/surfaces/Chat.tsx)).
- **CSS** — `.chat__commandStation` spacing for strip above stream.

### Charters

- **Create form IA** — visible `charterCreatePanel` above list/detail split; path meta at bottom only.

### Settings (081 / 150)

- **SurfacePage + SurfaceHero** with `pageTitle` / `pageLede` in [`surfaces.ts`](../../../../apps/desktop/src/copy/surfaces.ts).
- **No agent id** in readiness banner or live agent row copy.
- **Single** `<SurfaceProof surface="settings" />` at page footer (removed from General tab, Memory observatory, Culture panel).
- Onboarding reset toast strings moved to copy bundle.

### Channels

- **SplitLayout** list/detail with selected channel state and empty detail placeholder.

### Curation

- Filter bars moved from `.panel` wrapper to `.surfaceToolbar`.

### Onboarding

- **Dock offset** — `bottom: 120px`, `z-index: 90` so dock clears chat prompt bar on desktop.

## Manual verify

1. Quit live **otto** if open.
2. Open `/Applications/otto-staging.app` (or re-run `bash apps/desktop/scripts/deploy-staging.sh`).
3. Walk routes: Chat, Charters, Standards, Practices, Routines, Curation, Receipts, Autonomy, Skills, Knowledge, Tickets, Channels, Settings.
4. Confirm: one hero title per route, one “The test:” at bottom, no agent id in Settings banner, Command Station on Chat when connected.

## Automated capture

`scripts/otto-staging-proof-capture.cjs` timed out on sidebar nav in this run (CDP connected; Standards button not found within 30s). Re-run after staging window is focused:

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging/design-pass-20260613 \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-proof-capture.cjs
```

## Not in scope (deferred)

- P2: Chat picker placement, Channels/Knowledge copy sweep, onboarding brand pass.
- CDP screenshot capture — see [`design-review-20260613/page-audit.md`](../design-review-20260613/page-audit.md).
- Live `/Applications/otto.app` deploy — **requires Sebastian approval**.

## Follow-up pass (2026-06-13)

See [`design-review-20260613/page-audit.md`](../design-review-20260613/page-audit.md) for Tickets create panel, Receipts/Curation toolbars, Standards ratification strip, and detailSection refactors.
