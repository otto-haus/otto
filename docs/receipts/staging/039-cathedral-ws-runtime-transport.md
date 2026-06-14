# Staging receipt — 039 Cathedral WS runtime transport

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only

## Deploy

```sh
bash apps/desktop/scripts/deploy-staging.sh
```

## Runtime (staging CDP)

From `staging-proof-20260614061449.json`:

```txt
runtime_ready=true
transportMode=sdk
effectiveTransport=sdk subprocess
sessionMode=smoke
```

Settings shows transport line (`settingsTransportLine=true` in capture script).

## Verified

- `bun test ./apps/desktop/electron/runtime-transport/runtime-supervisor.test.ts` — supervisor + default `sdk` gate (see CI log 2026-06-14)
- `bun test ./apps/desktop/electron/runtime-transport/sdk-subprocess-transport.test.ts` — permission timeout + abort terminal
- Staging: runtime initializes to `ready` with SDK transport; WS promotion scorecard **not** run (default remains `sdk`)

## Not verified this pass

- Full WS promotion scorecard (disposable smoke, approval round-trip, reconnect traces)
- `OTTO_RUNTIME_TRANSPORT=ws` live path

## Artifacts

- `docs/receipts/staging/staging-proof-20260614061449.json`
