# Craft checklist — staging proof for v0.1.3 gate (12 items)

Date: 2026-06-14  
Build: `ship/v0.3-integration` @ `0a07320`  
App: `/Applications/otto-staging.app` (window title **otto staging**)  
Live `/Applications/otto.app` intentionally **not** updated.

## How to verify

1. Quit any window titled **otto** (live).
2. Open `/Applications/otto-staging.app` or run `bash apps/desktop/scripts/deploy-staging.sh`.
3. Confirm title bar reads **otto staging**, not **otto**.

## Checklist

| # | Item | Pass criteria | Status | Proof |
|---|------|---------------|--------|-------|
| 1 | Logo squeeze | Sidebar/chat owl not clipped; object-fit contain | pass (source) | `081-chat-shell-craft-product-polish.md`, styles.css |
| 2 | Social / OG image | Brand asset present for site + docs | pass | `site/`, `docs/brand/` |
| 3 | Thinking copy | Pulse uses product copy, not dev placeholder | pass | `081` rev9 manifest `workingPulse=true` |
| 4 | Agent/skills copy | Surfaces use Otto canon strings | pass | `copy/surfaces.ts` |
| 5 | Clean chat header | No agent id, MemFS, CONNECTED pill in Chat | pass (staging) | `081` `noMemFsString=true`, `noCliString=true` |
| 6 | Model/effort above send | Pickers in `.promptControls` above textarea | pass (source) | `Chat.tsx` promptCompose layout |
| 7 | No cli/tools footer | No `cli: override` / session footer strip | pass (staging) | `081` rev9 |
| 8 | System nav icons (057) | Distinct brand icons per System surface | pass | `057-system-nav-distinct-icons.md` |
| 9 | Traced send icon | Custom Icon.send, not stock paper-plane | pass (source) | iconography bundle |
| 10 | Toast/proposal UX | Propose correction modal + receipts inline | pass | `048`, `123` staging receipts |
| 11 | Sidebar brand (031) | Left-align + padding per ticket 031 | pass | `.brand { padding: 0 40px 4px 8px }` |
| 12 | Remotion walkthrough | Local `demo/out/otto-v01-desktop-walkthrough.mp4` rendered; GitHub release asset on hold until **`v0.1.3`** approval | pass | `receipts/otto-v01/demo-render-20260614T063531Z.md` |

## Live vs staging (why screenshot looked old)

Live app still shows legacy chrome:

- `agent-local-… · chatgpt-plus-pro/gpt-5.5 · MemFS on`
- CONNECTED pill, cli/tools footer, model pickers below input, stock send icon
- Window title **otto**

That is expected until Sebastian approves promoting staging to live. **Do not deploy to live without explicit approval.**

## Automated capture (optional)

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-rev10-proof.cjs
```
