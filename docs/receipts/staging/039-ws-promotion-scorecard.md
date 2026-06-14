# 039 — WS promotion scorecard (rev7)

**Date:** 2026-06-14  
**Git:** `fff0152`  
**Default transport:** `sdk` (unchanged — promotion gate not cleared)

## Summary

| Bucket | Count |
|--------|-------|
| Static checks pass | 7 |
| Static checks skip | 1 (staging CDP capture) |
| Dimensions pass | 4 |
| Dimensions partial | 1 |
| Dimensions fail | 4 |

**Verdict for promotion:** Not ready. Live Otto WS init did not reach `ready`. Unit coverage improved for reconnect, abort, and control_response. Default stays `sdk`.

## Static checklist

```sh
bash scripts/ws-promotion-scorecard.sh
# LETTA_AGENT_ID=agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2
```

| Check | Result | Evidence |
|-------|--------|----------|
| typecheck | pass | `/tmp/otto-scorecard-typecheck.log` |
| electron:typecheck | pass | `/tmp/otto-scorecard-electron_typecheck.log` |
| transport unit | pass (21/21) | `/tmp/otto-scorecard-transport_unit.log` |
| verify:v0 | pass | `/tmp/otto-scorecard-verify_v0.log` |
| smoke_cli_sdk | pass | `/tmp/otto-scorecard-smoke-sdk.log` — disposable `local-conv-90` |
| smoke_cli_ws | pass* | `/tmp/otto-scorecard-smoke-ws.log` — *direct Letta CLI only; does not exercise Otto `WsRuntimeTransport`* |
| smoke_cli_auto | pass | `/tmp/otto-scorecard-smoke-auto.log` |
| staging_capture | skip | Staging CDP not re-run this pass |

Machine-readable template: [`039-scorecard-template.json`](./039-scorecard-template.json)

## Promotion dimensions

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Init → ready | **fail** | [`039-ws-disposable-smoke-20260614064452.json`](./039-ws-disposable-smoke-20260614064452.json) — 45s timeout; `letta remote` stderr: `LETTA_API_KEY not found` |
| Send → first token | **fail** | Blocked on init; no JSONL |
| Full disposable turn | **fail** | `scripts/ws-disposable-smoke.ts` never reached `send()` |
| Approval round-trip | **partial** | Unit: `ws-runtime-transport.test.ts` (`resolvePermission` → `control_response`) |
| Abort mid-turn | **pass** | Unit: `abort_message` + `activeRunId` tracking |
| Reconnect / no false connected | **pass** | Unit: socket close → `ready=false`, `otto:event` |
| Trace + receipt mappable | **fail** | `trace-writer.ts` wired; no live WS turn artifact |
| No `conversation=default` in smoke | **pass** | `smokeMode()` guard in `ws-runtime-transport.ts` |
| `auto` fallback reason | **pass** | `runtime-supervisor.test.ts` |

## Live WS smoke attempt

```sh
OTTO_SMOKE=1 OTTO_AGENT_ID=agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2 \
  bun scripts/ws-disposable-smoke.ts
```

Result: init failed (`code=unreachable`). Manual repro:

```sh
LETTA_BASE_URL=http://127.0.0.1:<port> IGNORE_SELF_HOSTED_LISTENER_ERROR=1 \
  node …/letta.js remote --env-name otto-byor --backend local
# → Error: LETTA_API_KEY not found
```

Per [Letta BYOR docs](https://docs.letta.com/letta-code/remote-client-byor), `LETTA_BASE_URL` must point at the client listener (Otto implements this). Current blocker is upstream CLI auth for `letta remote`, not the loopback listener shape.

## Code changes this pass (rev7)

- `ws-runtime-transport.ts`: `trackActiveRun`, abort `abort_message`, `turnIdle` for send completion, spawn via `node` (not bun/electron execPath), stderr on remote exit
- `runtime-common.ts`: `smokeMode()` call-time helper
- `ws-runtime-transport.test.ts`: mock BYOR tests (init+reconnect, abort, control_response, smokeMode)
- `scripts/ws-disposable-smoke.ts`: headless live smoke harness
- `scripts/ws-promotion-scorecard.sh`: unchanged runner; dimensions filled in JSON manually

## Staging

- `/Applications/otto-staging.app` available; CDP `:9445` responded earlier in session
- Prior staging proof remains SDK-only: [`039-cathedral-ws-runtime-transport.md`](./039-cathedral-ws-runtime-transport.md)
- Re-run with `OTTO_RUNTIME_TRANSPORT=ws` in staging plist + `LETTA_API_KEY` after key is configured

## Next proof (for reviewer +1)

1. Configure `LETTA_API_KEY` (Settings or env) and re-run `scripts/ws-disposable-smoke.ts`
2. Capture JSONL under `~/.otto/runs/` and receipt under `~/.otto/receipts/`
3. Staging deploy with `OTTO_RUNTIME_TRANSPORT=ws` + disposable CDP init/send
4. Optional: approval tool turn with `control_request` trace
