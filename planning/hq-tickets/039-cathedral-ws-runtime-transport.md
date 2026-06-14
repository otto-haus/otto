# 039 — Cathedral: WebSocket Runtime Transport

Owner: Codex
Priority: P0
Depends on: 033, 034, 035, 036, 037, 038, **076**
Release bucket: vNext runtime

## Outcome

Otto has a first-class local WebSocket runtime transport that can replace the current SDK/subprocess runner as the default desktop runtime path **only after proof**.

The cathedral version is not "try WS mode." It is:

```txt
Otto Desktop owns the local command-station boundary.
Letta owns agent memory/runtime.
The transport is replaceable, observable, approval-aware, recoverable, and proven.
```

When done, Chat, Settings, approvals, traces, receipts, and runtime readiness all speak to a stable Otto runtime interface. The default path uses a local loopback WebSocket/BYOR-style Letta Code listener when available. The SDK/subprocess runner remains as an explicit fallback, not the architecture.

## Why this matters

The current `@letta-ai/letta-code-sdk` path is acceptable for v0.1, but it is a CLI subprocess control path. It can ship, but it is not the ideal foundation for a desktop workspace that needs:

- fast startup and reconnect behavior
- durable stream recovery
- first-class approval/control events
- mobile/desktop convergence with Letta's own direction
- clean runtime supervision instead of ad hoc child-process coupling
- a transport seam that can survive Letta protocol changes

This advances Otto's proof loop because the runtime path becomes observable and receipt-grade: every connected state, turn, approval, abort, reconnect, and fallback has a trace.

Authority rule (unchanged):

```txt
Letta remembers.
Otto improves.
Files are canon.
Adapters — including transports — are replaceable.
```

## Source anchors

- Otto renderer boundary: `docs/v1/otto-v1-surface-contracts.md`
- Adapter seam (transport stays below authority): `docs/v1/contracts/adapter-seam.md`
- Current SDK runner: `apps/desktop/electron/letta-runner.ts`
- Runtime convergence note: `docs/desktop-convergence.md`
- Approval / autonomy gates: `docs/autonomy.md`
- v2 local-mode target: `docs/otto-v2-spec.md` (§5 — Letta Code local mode first)
- Staging-only proof rule: `planning/hq-tickets/000-canonical.md`
- Letta Remote Client API: https://docs.letta.com/letta-code/remote-websocket-api
- Letta self-hosted remote API / BYOR: https://docs.letta.com/letta-code/remote-client-byor

## Architecture target

### 1. Stable Otto runtime interface

Introduce an Electron-main runtime boundary, for example:

```ts
interface OttoRuntimeTransport {
  initialize(input: RuntimeInitInput): Promise<RuntimeStatus>;
  send(input: RuntimeSendInput): Promise<void>;
  abort(input?: RuntimeAbortInput): Promise<void>;
  approve(requestId: string, decision: PermissionResponse): Promise<void>;
  status(): RuntimeStatus;
  close(): Promise<void>;
}
```

Implementations:

- `WsRuntimeTransport` — preferred local WebSocket/BYOR path.
- `SdkSubprocessTransport` — existing SDK runner, retained as fallback.
- `RuntimeSupervisor` — owns process/socket lifecycle, health, restart policy; not the renderer.

Renderer still calls only:

```txt
window.otto.runtime.status()
window.otto.runtime.initialize()
window.otto.runtime.send(text)
window.otto.runtime.abort()
window.otto.runtime.approve(requestId, decision)
```

No renderer imports Letta SDK, `ws`, or Letta protocol packages.

Runtime diagnostics (transport mode, cli path, last error, reconnect) belong in **Settings**, not a Chat footer meta line. Chat shows only user-facing subtitle states per the recent UI pass.

### 2. Local BYOR command-station mode

Otto starts or attaches to a loopback-only WebSocket session inside Electron main:

```txt
host: 127.0.0.1
auth: per-session bearer token
origin: validate browser/electron origin if browser can connect
scope: one Otto runtime per selected agent/conversation
```

Then Otto starts or attaches to the Letta Code local listener/runtime that connects to that endpoint.

Expected event flow:

```txt
Letta runtime -> WebSocket -> Otto main -> normalized Otto events -> renderer
renderer -> IPC -> Otto main -> WebSocket command -> Letta runtime
```

This should use Letta's Remote Client API/BYOR semantics where available:

- `sync`
- `input` with `payload.kind = create_message`
- `stream_delta`
- `update_device_status`
- `update_loop_status`
- `control_request`
- `abort_message`
- `ping` / `pong`

If the installed Letta build does not expose a stable local BYOR command, the ticket **blocks** with the exact version/command gap instead of inventing an incompatible protocol.

### 3. Transport promotion gate

Add a transport mode setting:

```txt
OTTO_RUNTIME_TRANSPORT=sdk|ws|auto
```

Rules:

- `sdk` uses the current runner.
- `ws` requires the WebSocket path and fails honestly if unavailable.
- `auto` tries WS first **only after** the promotion scorecard passes, then falls back to SDK with a visible status reason.
- **Default remains `sdk` until reviewer +1 on this ticket.**
- After proof, default may become `auto` with WS preferred — not before.

**Promotion scorecard** — WS must beat SDK on every row, evidenced in traces:

| Dimension | Pass criterion |
|---|---|
| Init → ready | WS reaches truthful `connected` without false-positive; latency recorded in trace |
| Send → first token | WS first `stream_delta` within SDK baseline or documented acceptable delta |
| Full turn | Disposable smoke: send, stream, idle (`WAITING_ON_INPUT` or equivalent) |
| Approval round-trip | `control_request` → Chat card → approve/deny → runtime continues |
| Abort | Abort mid-turn; Chat/runtime not falsely `connected` |
| Reconnect | Listener crash or socket close; recovery or honest `not ready`; no zombie connected |
| Trace/receipt | Every turn/block/fallback has trace + receipt mappable to Done-when |
| Safety | No write to `conversation=default`; staging-only proof |

Settings must show the effective transport:

```txt
runtime: connected
transport: websocket local / sdk subprocess fallback
agent: <id>
conversation: <id>
last reconnect: <timestamp or never>
```

### 4. Approval/control fidelity

Tool and gate requests from the WS path must become the same Otto permission cards as the SDK path.

Required behavior:

- `control_request` renders an inline Chat approval card.
- Approve sends the scoped decision back to the runtime.
- Deny sends an explicit denial message back to the runtime.
- Approval/denial writes a receipt or trace entry.
- Consequential actions cannot be silently auto-approved (`docs/autonomy.md`).

### 5. Receipts and traces

Every runtime turn writes a trace under `~/.otto/runs/` or the existing trace root:

```txt
transport
connection_id or local listener id
agent_id
conversation_id
startup command, with secrets redacted
sync events
input command
stream deltas
control requests
approval decisions
abort/retry/reconnect events
terminal result or blocker
fallback reason if SDK was used
```

Every successful, blocked, failed, aborted, or fallback turn writes an Otto receipt with evidence pointing to the trace.

### 6. Reconnect and recovery

The WS path must handle:

- cold launch with no listener
- listener already running
- listener crash after connect
- socket close mid-turn
- duplicate runtime connection
- stale conversation
- approval pending across reconnect
- failed sync
- fallback to SDK when WS is unavailable in `auto`

No reconnect may leave Chat falsely `connected`.

### 7. Security boundary

The local WS server must be hard to misuse:

- bind only to `127.0.0.1`
- per-session token required
- token never logged
- secrets never printed
- reject unauthenticated sockets
- reject unexpected origins when applicable
- no LAN/internet exposure
- no raw memory/canon writes outside Letta/Otto authority paths
- all file/terminal/memory/secret commands remain privileged and approval-governed

## Implementation phases

Implement in order; each phase must keep `sdk` mode green:

```txt
Phase A — Extract SdkSubprocessTransport behind OttoRuntimeTransport (no behavior change)
Phase B — WsRuntimeTransport + event normalizer + RuntimeSupervisor
Phase C — Settings transport diagnostics + OTTO_RUNTIME_TRANSPORT env/config
Phase D — Smoke matrix + promotion scorecard table in Execution receipt
```

Suggested owned paths:

```txt
apps/desktop/electron/letta-runner.ts          (shrink to supervisor + wiring)
apps/desktop/electron/runtime-transport/**     (new)
apps/desktop/electron/shared/types.ts
apps/desktop/electron/ipc.ts
apps/desktop/electron/preload.ts
apps/desktop/src/runtime.ts
apps/desktop/src/surfaces/Panes.tsx            (Settings diagnostics only)
apps/desktop/electron/*.test.ts
```

## Scope

- Add a transport abstraction around the current Electron main runtime path.
- Keep the existing SDK runner working as fallback.
- Implement a local WS/BYOR runtime path behind the same IPC/preload API.
- Add runtime supervision for starting/stopping/monitoring the local listener.
- Normalize WS events into the existing Chat transcript/runtime event model.
- Map WS control/approval events into the existing Otto permission and receipt model.
- Add trace and receipt coverage for connected, failed, blocked, aborted, and fallback states.
- Add Settings diagnostics for transport mode and current transport.
- Add tests for transport selection, event normalization, approval mapping, fallback, and false-connected prevention.
- Add staging smoke proof using a disposable conversation only.

## Out of scope

- Letta Cloud remote environments as the default path.
- `letta server` Cloud registration as a required install step.
- LAN or internet WebSocket exposure.
- Replacing Letta memory or writing directly to Letta memory from Otto.
- Rewriting Chat UI beyond what is needed to render accurate runtime/control states.
- Shipping a fake demo state for WS.
- Touching or relaunching `/Applications/otto.app` during proof.
- Removing the SDK fallback before WS has reviewer-accepted proof.
- Paperclip, Discord, Stacks, Intake, or mobile app work.

## Done when

- `OttoRuntimeTransport` or equivalent exists and the renderer still uses only `window.otto.runtime.*`.
- Current SDK/subprocess behavior is moved behind `SdkSubprocessTransport` with no regression.
- `WsRuntimeTransport` can connect to a local loopback Letta Code listener/runtime using documented Remote Client API/BYOR-compatible events, or blocks with exact upstream command/version gap.
- `OTTO_RUNTIME_TRANSPORT=sdk|ws|auto` works and Settings shows the effective transport.
- `ws` mode runs a disposable-conversation smoke: initialize, sync, send one message, receive streamed content, reach idle, write trace, write receipt.
- `ws` mode handles at least one approval/control request end-to-end: request appears in Chat, approve/deny returns to runtime, trace/receipt records decision.
- `abort` works in `ws` mode and leaves runtime/Chat in a truthful state.
- Reconnect smoke covers listener crash or socket close and proves Chat does not remain falsely connected.
- `auto` mode falls back to SDK with a visible reason when WS is unavailable.
- Promotion scorecard table is filled in Execution receipt with trace evidence for each row.
- No smoke writes to Sebastian's live `conversation=default`.
- No proof touches, closes, replaces, or relaunching live `/Applications/otto.app`; all UI/runtime proof uses Otto staging.
- Unit tests cover transport selection, event normalization, approval mapping, fallback reason, and stale/disconnected status.
- Typecheck/build pass.
- Execution receipt maps every Done-when item to command output, trace path, receipt path, and screenshot/log artifact where applicable.

## Verification

Commands/checks to run:

```sh
cd /Users/seb/Code/otto
git status --short --branch
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test ./apps/desktop/electron/*.test.ts
bun run verify:v0

# SDK fallback proof
OTTO_RUNTIME_TRANSPORT=sdk OTTO_SMOKE=1 task smoke:cli

# WS proof, exact command may change during implementation
OTTO_RUNTIME_TRANSPORT=ws OTTO_SMOKE=1 task smoke:cli

# Auto promotion/fallback proof
OTTO_RUNTIME_TRANSPORT=auto OTTO_SMOKE=1 task smoke:cli
```

Runtime/UI proof:

```txt
Use staging only:
/Users/seb/.codex/admin/otto-staging/otto-staging.app
/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
/Applications/otto-staging.app
```

Required artifacts:

- trace JSONL for SDK fallback
- trace JSONL for WS success
- trace JSONL for WS approval
- trace JSONL for WS reconnect/failure
- receipt for each trace
- promotion scorecard table (latency + pass/fail per dimension)
- screenshot or browser proof showing Settings effective transport
- reviewer-readable summary mapping Done-when → proof

## Review focus

Reviewer must reject if:

- connected state is inferred rather than proven by runtime events
- WS path writes to `conversation=default`
- WS path requires Letta Cloud by default
- SDK path regresses
- approval/control requests bypass Otto's gate model
- trace/receipt evidence is missing or cannot be mapped to Done-when
- renderer imports Letta SDK, WS protocol internals, or transport-specific code
- implementation exposes loopback server beyond localhost or logs secrets
- default transport flips to `auto`/WS before promotion scorecard is evidenced

## Blocker log

Leave blank unless blocked.
