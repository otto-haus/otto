# Staging proof receipts

Staging-only verification for Otto desktop tickets blocked on manual/staging proof.

**Never use `/Applications/otto.app`** — only `/Applications/otto-staging.app`.

## Deploy

```sh
cd /Users/seb/Code/otto
bash apps/desktop/scripts/deploy-staging.sh
```

Isolated env (default):

```txt
staging_app=/Applications/otto-staging.app
home=$HOME/.codex/admin/otto-staging/home
otto_home=$HOME/.codex/admin/otto-staging/otto-home
profile=$HOME/.codex/admin/otto-staging/profile
port=9445
build_marker=<git short SHA>
```

## Smoke scripts

Requires Playwright once: `npm install playwright` in `~/.codex/admin` (or set `NODE_PATH`).

### UI proof capture (127, 046, 047, 067, 039 settings line)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-proof-capture.cjs
```

Writes `staging-proof-<runId>.json` and PNGs in this directory.

### Onboarding connected-first + CTA paths (069–073)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-onboarding-smoke.cjs
```

Phases:

| Phase | Ticket | Asserts |
|-------|--------|---------|
| A | 069 | Fresh profile + Letta `ready` — capture state (Welcome should show; see receipt if auto-started) |
| B | 071, 072 | Secondary CTA → Receipts + **First Receipt** dock + **Sample proof record** (not connect dock) |
| C | 072 | Primary **Get started →** CTA → connect dock (`Connect your runtime`) |
| D | 073 | 880px viewport — composer visible after Skip |

Latest smoke: `onboarding-smoke-20260614062759.json` (all phases ok).

### Two-thread isolation (046)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-two-thread-smoke.cjs
```

Creates two threads (UI **New chat** + IPC), stores distinct markers per `otto.chat.messages.<threadId>.v1`, switches threads, asserts UI text and storage keys stay isolated. Writes `two-thread-smoke-<runId>.json` and PNGs `046-two-thread-{a,b}-<runId>.png`.

Legacy 032 script: `~/.codex/admin/otto-032-onboarding-smoke.cjs` (skip/relaunch/connect/run phases).

### Rev8 ticket proof batch (033, 036, 037, 048, 049, 050, 057, 081)

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-rev8-proof.cjs
```

Optional 036 validation recapture:

```sh
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev8-036-recapture.cjs
```

Latest: `staging-rev8-proof-20260614070035.json` (all eight tickets `ok: true`).

## Receipt index

| Ticket | Markdown | Screenshots |
|--------|----------|-------------|
| 033 | `033-bug-desktop-responsive-resize.md` | `033-resize-*-{chat,standards,settings}.png` (12) |
| 036 | `036-bug-curation-deferred-filter.md` | `036-curation-pending-filter.png`, `036-curation-deferred-decided-filter.png` |
| 037 | `037-bug-standards-skipped-visible.md` | `037-practices-skipped-loader.png` |
| 048 | `048-chat-propose-from-correction.md` | `048-correction-proposal-curation.png` |
| 049 | `049-chat-ticket-orchestration-commands.md` | `049-chat-ticket-compile.png` |
| 050 | `050-standards-precedent-conflict-path.md` | `050-precedent-conflict-banner.png` |
| 057 | `057-system-nav-distinct-icons.md` | `057-system-nav-distinct-icons.png`, `057-nav-*.png` |
| 081 | `081-chat-shell-craft-product-polish.md` | `081-chat-shell-before-reference.png`, `081-chat-shell-craft-product-polish.png` |
| 068 | `068-pgvector-local-recall-store.md` | stub receipt |
| 080 | `080-onboarding-one-app-zero-setup.md` | copy walkthrough |
| 135 | `135-culture-ci-demo-vertical-slice.md` | `135-culture-ci-demo/*.png` |
| 039 | `039-cathedral-ws-runtime-transport.md` | — (settings transport line in JSON) |
| 045 | `045-chat-permission-modal-abort-fix.md` | — (unit tests) |
| 046 | `046-conversation-list-thread-switcher.md`, `046-thread-list-smoke-20260614.md` | `046-sidebar-thread-list.png`, `046-two-thread-*.png` |
| 047 | `047-letta-memory-read-surface.md` | `047-memory-observatory.png` |
| 059 | `059-command-station.md` | `127-command-station-culture-home.png` (ready session) |
| 065 | `065-marketing-site-otto-haus.md` | — (static site checks) |
| 067 | `067-onepagers-surface-alignment.md` | `067-standards-test-footer.png`, `067-settings-test-footer.png` |
| 069 | `069-bug-onboarding-welcome-skipped-when-connected.md`, `069-onboarding-smoke-20260614.md` | `069-connected-first-state.png` |
| 071 | `071-bug-onboarding-missing-receipt-step-sample.md` | `071-072-receipts-sample-onboarding.png` |
| 072 | `072-bug-onboarding-receipts-cta-wrong-dock.md` | `072-primary-connect-dock.png`, shared sample PNG |
| 073 | `073-bug-onboarding-dock-ux-gaps.md` | `073-narrow-dock-layout.png` |
| 081 | `081-chat-shell-partial.md` | `081-chat-shell-staging.png` |
| 134 | `134-checks-surface.md` | `134-checks-surface.png` |
| 135 | `135-culture-ci-demo.md` | blocked: `135-culture-ci-block.png` |
| 127 | `127-command-station-culture-home.md` | `127-command-station-culture-home.png` |
