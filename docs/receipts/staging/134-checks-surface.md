# Staging receipt — 134 Checks surface + block UX

**Date:** 2026-06-14 (rev9)  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Deploy + capture

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-rev7-proof.cjs
```

## Checks (rev9)

| Check | Result |
|-------|--------|
| `checksSurfaceVisible` | **true** |
| `checksSurfaceHasContent` | **true** — 2 active checks seeded |
| `checksSeededGte1` | **true** — `completion-requires-receipts`, `one-way-door-approval` |
| `checksNoLogWording` | **true** |
| Inline block UX in Chat | **true** — see `135-culture-ci-block.png` |

## Screenshot

`docs/receipts/staging/134-checks-surface.png`

## Artifacts

- `docs/receipts/staging/staging-rev7-proof-20260614070123.json`
- Seed path: `$OTTO_HOME/checks/` via deploy `ditto` + bundled `Resources/checks`
