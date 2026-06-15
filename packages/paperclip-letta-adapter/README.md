# paperclip-adapter-letta

Run a persistent, memory-backed **Letta** agent (otto) from inside [Paperclip](https://github.com/paperclipai/paperclip).

This is an external Paperclip **adapter** plugin. It bridges Paperclip's control plane to an existing local Letta agent so that a Paperclip issue assigned to the agent is driven by Letta — and the agent keeps its memory across runs.

This is **v1** of the otto → Paperclip direction: _"use Letta from Paperclip."_ The otto culture/governance layer (receipts, standards, ratification) ships later as a separate Paperclip _plugin_.

## What it does

```
Paperclip issue assigned to otto
  -> letta_local adapter execute()
  -> POST /v1/agents/{agentId}/messages on your Letta server (cloud or local)
  -> assistant reply + token usage returned to Paperclip
```

Memory continuity is anchored to the Letta `agentId`: the adapter reuses an existing Letta agent rather than spawning a fresh, amnesiac one. Provider API keys live in **Letta**, never in this adapter or Paperclip.

> The adapter `type` stays `letta_local` (the stable install identifier) even when the runtime is Letta Cloud. Only the human-facing label is `Letta (cloud or local)`.

## Network boundary (read first)

The adapter runs **wherever the Paperclip server runs** and reaches Letta over HTTP at `baseUrl`.

- **Letta Cloud (`https://api.letta.com`) is a public authenticated API**, so it works from a cloud Paperclip (e.g. `paperclip.tryveto.com`) with **no tunnel and no Cloudflare Access**.
- A **local** Letta on `http://127.0.0.1:8283` is only reachable when the Paperclip server runs on the **same machine**.

### Deployment modes

- **Mode 1 — Letta Cloud (recommended):** Paperclip -> `https://api.letta.com` -> persistent `otto` agent. Auth via `Authorization: Bearer <LETTA_API_KEY>`. Works from a cloud Paperclip natively.
- **Alternate A — local, same machine:** local Paperclip -> local Letta on the same Mac. Good for local proof.
- **Alternate B — self-host behind Cloudflare Access (dormant):** Paperclip -> a protected remote Letta you operate -> persistent `otto` agent. Reserved fallback; not the default. Never expose an unauthenticated Letta to the open internet.

#### Mode 1 — Letta Cloud config

```jsonc
{
  "baseUrl": "https://api.letta.com",
  "token": "<LETTA_API_KEY>", // or the LETTA_API_KEY env var
  "agentId": "agent-..."
}
```

- Requires a Letta **API Plan** for API-key (Bearer) auth used by automated/scripted runs. (Personal/Pro/Max plans use interactive OAuth and forbid automated use.)
- Provider/model keys live in Letta via **BYOK** (bring your own keys); the adapter only observes `providerConfigured` (a boolean — whether Letta returns models) and never reads or stores keys.

#### Alternate B — self-host behind Cloudflare Access config

```jsonc
{
  "baseUrl": "https://your-letta-host.example",
  "agentId": "agent-...",
  "cfAccessClientId": "<service-token-id>",
  "cfAccessClientSecret": "<service-token-secret>"
}
```

The adapter sends `CF-Access-Client-Id` / `CF-Access-Client-Secret` (or any `headers` you pass, or a bearer `token`). Provider API keys still live only in Letta.

## Configuration

Set on the agent's `adapterConfig`:

- `agentId` (required) — id of an existing Letta agent (e.g. `agent-...`). The memory anchor.
- `baseUrl` (optional) — Letta server URL. Use `https://api.letta.com` for Letta Cloud (Mode 1). Defaults to `LETTA_BASE_URL`, then `http://127.0.0.1:8283` (local).
- `token` (optional) — bearer token. For Letta Cloud this is your `LETTA_API_KEY` (sent as `Authorization: Bearer`); for a self-hosted server it is the server password. Defaults to `LETTA_API_KEY`.
- `cfAccessClientId` / `cfAccessClientSecret` (optional) — Cloudflare Access service-token credentials for a protected remote Letta (Alternate B). Default to `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`.
- `headers` (optional) — arbitrary extra request headers (custom gateways / proxies).
- `model` (optional) — Letta model handle to request (e.g. `letta/auto`).
- `promptTemplate` (optional) — `{{taskTitle}}` / `{{taskBody}}` / `{{wakeReason}}` template for the user message.
- `timeoutSec` (optional) — per-run timeout in seconds (default 300).
- `receiptRef` (optional) — v2 placeholder; carried through to `resultJson` for the future otto culture plugin. Unused in v1.

## Install into Paperclip

Ship as a **local path** install for local proof first; publish to npm only after the adapter has completed one real issue round-trip. Build first, then install the built directory as a local adapter:

```sh
bun run --cwd packages/paperclip-letta-adapter build

# From the Paperclip UI: Settings -> Adapters -> Install Adapter -> local path
# Or via API (local path install):
curl -X POST http://localhost:3102/api/adapters \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"packageName": "/ABS/PATH/packages/paperclip-letta-adapter", "isLocalPath": true}'
```

Once installed, `letta_local` appears as a selectable adapter when creating an agent. Publish to npm (`paperclip-adapter-letta`) only once the local round-trip works.

## Design notes

- **Self-contained.** The Paperclip adapter contract is vendored in `src/contract.ts` (a structural subset of `@paperclipai/adapter-utils`). Paperclip's plugin loader duck-types adapters (`createServerAdapter()` returning `{ type, execute, testEnvironment }`), so the package needs no host-resolved dependency at runtime.
- **HTTP, not CLI.** v1 talks to a running Letta backend over REST. Bundling/supervising a Letta runtime is a later, optional step.
- **No UI parser yet.** Run output renders via Paperclip's generic shell parser. A self-contained `ui-parser.ts` is a v1.1 follow-up.

## Develop

```sh
bun run --cwd packages/paperclip-letta-adapter typecheck
bun test packages/paperclip-letta-adapter
bun run --cwd packages/paperclip-letta-adapter build
```
