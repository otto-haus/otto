# Staging receipt — 081 Chat shell craft (partial)

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only  
**Status:** **Partial**

## Deploy + capture

```sh
bash apps/desktop/scripts/deploy-staging.sh
# 1280×800 screenshot via CDP supplement capture
```

## Checks (this pass)

| Criterion | Result |
|-----------|--------|
| Screenshot at 1280px | **true** — `081-chat-shell-staging.png` |
| No `cli:` in Chat chrome | **true** (body text audit) |
| No `MemFS on` in Chat chrome | **true** |
| No fake CONNECTED pill in Chat header | **unverified** — runtime not connected; full header craft needs ready session |
| Command Station visible | **false** — gated on `runtime.ready` |
| Thread list in sidebar | **true** |

## Source audit (pass)

`Chat.tsx` uses `chatCopy.workingPulse` for working state; no `cli:` / `MemFS on` strings in Chat surface source.

## Not done

- Before/after pair at 1280px
- Working-state pulse during live turn
- Reviewer +1

## Artifacts

- `docs/receipts/staging/081-chat-shell-staging.png`
- `docs/receipts/staging/staging-supplement-20260614063245.json`
