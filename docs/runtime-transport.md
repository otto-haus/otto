# Runtime transport modes

Canonical contract for how Otto Desktop connects to the Letta runtime. Code lives under `apps/desktop/electron/runtime-transport/`.

Cross-links:

- WS transport ticket: [`planning/hq-tickets/039-cathedral-ws-runtime-transport.md`](planning/hq-tickets/039-cathedral-ws-runtime-transport.md)
- Embedded engine: [`planning/hq-tickets/076-embedded-letta-one-app-distribution.md`](planning/hq-tickets/076-embedded-letta-one-app-distribution.md)
- Cloud remote (parked): [`planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md`](planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md)
- Adapter seam: [`docs/v1/contracts/adapter-seam.md`](docs/v1/contracts/adapter-seam.md)

## Architecture

```txt
Renderer  →  IPC (window.otto.runtime.*)  →  RuntimeSupervisor  →  OttoRuntimeTransport
                                              ├─ SdkSubprocessTransport  (default)
                                              └─ WsRuntimeTransport      (loopback BYOR)
```

`RuntimeSupervisor` owns selection, fallback, and delegation. The renderer never imports Letta SDK or WebSocket libraries.

## Connection modes

### Implemented today (`OTTO_RUNTIME_TRANSPORT`)

| Mode | Env value | Default? | Behavior |
|------|-----------|----------|----------|
| **SDK subprocess** | `sdk` (or unset) | **Yes** | Spawns Letta Code via `@letta-ai/letta-code-sdk` session |
| **WebSocket BYOR** | `ws` or `websocket` | No | Loopback WSS listener; `letta remote --backend local` connects inbound |
| **Auto (local only)** | `auto` | No | Try WS init; on failure fall back to SDK with visible reason |

Resolution (`transport-mode.ts`):

```ts
process.env.OTTO_RUNTIME_TRANSPORT ?? 'sdk'  // sdk | ws | websocket | auto
```

Unknown values (including `cloud`) fall back to **`sdk`** — never to a remote/cloud path.

### Planned / advanced (not in supervisor yet)

Documented in HQ tickets for one contract; **not selectable** via `OTTO_RUNTIME_TRANSPORT` today:

| Mode | Ticket | Notes |
|------|--------|-------|
| embeddedLocal | 076 | Bundled engine inside Otto.app |
| existingLetta | — | External Letta.app / CLI attachment |
| cloudRemote | 077 (parked) | Env list + status WS + sync/input |
| cloudApi | 077 (parked) | Hosted chat API; limitations TBD |
| selfHosted | 039 | BYOR URL to operator-controlled endpoint |

When adding a mode, extend `RuntimeSupervisor` — do not silently route `auto` to cloud.

## Invariants

1. **`auto` = local WS ↔ SDK only.** No Cloud fallback on failure. If WS init fails, supervisor closes WS and initializes SDK; `transportFallbackReason` is set on status.
2. **Mode switch is operator-visible.** `RuntimeStatus` exposes `transportMode`, `effectiveTransport`, and `transportFallbackReason`.
3. **Paperclip/Otto ticket Done ≠ Letta/Paperclip task done.** Transport proof is runtime receipts + traces, not ticket folder moves.
4. **Secrets: boolean-only logging.** Never log `LETTA_API_KEY` or other secret values; code checks `hasSecret('LETTA_API_KEY')` only.
5. **Default stays SDK** until WS promotion scorecard passes (039). Comment in `transport-mode.ts`: *"Default stays SDK until WS promotion proof is accepted."*
6. **Smoke never uses `conversation=default`.** Both transports throw/refuse when `OTTO_SMOKE=1` and conversation would be `default`.

## Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `OTTO_RUNTIME_TRANSPORT` | `resolveTransportMode()` | `sdk` \| `ws` \| `websocket` \| `auto` |
| `OTTO_SMOKE` | `runtime-common.ts` | `1` / `true` → smoke session rules |
| `OTTO_MEMFS` | SDK transport | Enable memfs on SDK session |
| `LETTA_CLI_PATH` | Both | Override Letta Code CLI path |
| `LETTA_API_KEY` | Both | Injected into child env if set (never log) |
| `LETTA_BASE_URL` | SDK / discovery | Override discovered local backend URL |
| `OTTO_AGENT_ID` | Discovery | Agent candidate override |
| `OTTO_WS_REMOTE_ENV` | WS transport | `--env-name` for `letta remote` (default `otto-byor`) |
| `OTTO_LETTA_SETTINGS_PATH` | Discovery | Override `~/.letta/settings.json` path |
| `OTTO_SKIP_LETTA_LSOF` | Discovery | Skip macOS `lsof` port discovery |

## Bundled Letta CLI (076)

`resolveCli('embedded')` in `runtime-common.ts` searches, in order:

1. `$LETTA_CLI_PATH` when set
2. `process.resourcesPath/app/node_modules/@letta-ai/letta-code/letta.js` (packaged `.app` with `asar: false`)
3. Dev `node_modules` fallbacks

Packaged path (macOS):

```txt
Otto.app/Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js
```

Smoke: `bash scripts/embedded-letta-smoke.sh` (`OTTO_EMBEDDED_APP` optional).

## Fallback behavior (`auto`)

From `runtime-supervisor.ts` `init()`:

```txt
auto:
  1. If WS promotion gate not passed → SDK only, transportFallbackReason = promotion gate message
  2. Close SDK
  3. ws.init()
  4. If wsStatus.ready → active = WS, effectiveTransport = "websocket local"
  5. Else → close WS, sdk.init(), active = SDK,
     transportFallbackReason = wsStatus.reason ?? "WebSocket transport unavailable"
```

Gate: `ws-promotion-gate.ts` — `OTTO_WS_PROMOTION_APPROVED=1` or scorecard with all dimensions `pass`. Until then, `auto` never attempts WS.

`sdk` and `ws` modes are exclusive: the non-selected transport is closed on init.

## WebSocket event map (039)

Otto listens on loopback (`127.0.0.1`, random port, bearer token). Letta Code `remote --backend local` connects inbound.

### Commands (Otto → runtime)

| Command | When |
|---------|------|
| `sync` | Init — agent/conversation sync, `recover_approvals: true` |
| `input` + `payload.kind: create_message` | User send |
| `control_response` | Permission modal approve/deny |
| `abort_message` | User abort mid-turn |

### Events (runtime → Otto)

| Event | Handling |
|-------|----------|
| `sync_response` / `conversation_created` | Sets `conversationId` on status |
| `update_device_status` | `is_online` → sync handshake |
| `update_loop_status` | `WAITING_ON_INPUT` + empty `active_run_ids` → turn complete |
| `stream_delta` | Normalized to renderer `assistant` message (`ws-protocol.ts`) |
| `control_request` | → `otto:permission` IPC (permission modal) |
| `error` | Normalized to renderer error event |

### Reconnect

- New inbound socket sets `lastReconnectAt` ISO timestamp on status.
- Socket `close` marks runtime not ready with reason (no silent reconnect loop in v1).

### Mapping to UI surfaces

| Signal | Surface |
|--------|---------|
| `RuntimeStatus.ready` | Chat enablement / Settings connection card |
| `transportMode`, `effectiveTransport`, `transportFallbackReason` | Settings transport diagnostics |
| `otto:permission` | Permission modal (ticket 045) |
| Chat receipts + trace JSONL | Receipt writer on turn end |

SDK transport uses the same permission and receipt patterns via `@letta-ai/letta-code-sdk` callbacks instead of WS frames.

## SDK transport (summary)

- Loads `@letta-ai/letta-code-sdk`, creates a `Session` with `canUseTool` → permission modal.
- Discovers agent/base URL via `discoverLocalLettaContext()` (`letta-discovery.ts`): Otto config, env, `~/.letta/settings.json`, macOS `lsof` for Letta listen port.
- Status codes: `ready`, `no-api-key`, `no-agent`, `stale`, `unreachable`, `sdk-missing`, `error`.

## Promotion gate (039)

WS may become default over SDK only after reviewer +1 on promotion scorecard evidence:

| Dimension | Pass criterion |
|-----------|----------------|
| Init → ready | WS reaches truthful `ready` without false-positive; latency in trace |
| Send → first token | First `stream_delta` within SDK baseline or documented delta |
| Full turn | Disposable smoke: send, stream, idle |
| Approval round-trip | `control_request` → modal → runtime continues |
| Abort | Abort mid-turn; status not falsely `ready` |
| Reconnect | Documented recovery behavior |
| Fallback | `auto` shows `transportFallbackReason` when WS unavailable |

Until then: **default `OTTO_RUNTIME_TRANSPORT` is `sdk`**.

## Verification

```sh
test -f docs/runtime-transport.md
cd apps/desktop && bun test electron/runtime-transport/transport-mode.test.ts
# mode parsing smoke:
OTTO_RUNTIME_TRANSPORT=auto bun -e "console.log(require('./electron/runtime-transport/transport-mode.ts'))"
```

Staging-only runtime proof: see [`docs/v1/runbooks/live-vs-staging.md`](docs/v1/runbooks/live-vs-staging.md).
