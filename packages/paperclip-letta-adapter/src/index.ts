import type { AdapterModel } from "./contract.js";

/** snake_case, globally unique adapter type. */
export const type = "letta_local";
export const label = "Letta (cloud or local)";

export const models: AdapterModel[] = [{ id: "letta/auto", label: "Letta (auto)" }];

export const agentConfigurationDoc = `# letta_local agent configuration

Adapter: letta_local

Run a persistent, memory-backed Letta agent (otto) from inside Paperclip.

Network boundary (read first):
- The adapter runs wherever the Paperclip server runs and must reach the Letta server over HTTP at baseUrl.
- Letta Cloud is a public authenticated API, so it works from a cloud Paperclip with no tunnel. A local Letta is only reachable when Paperclip runs on the same machine.

Mode 1 — Letta Cloud (recommended):
- baseUrl=https://api.letta.com, token=<LETTA_API_KEY> (or the LETTA_API_KEY env), agentId=agent-...
- Works natively from a cloud Paperclip (e.g. paperclip.tryveto.com): the API is public and authenticated, so no Cloudflare Access or secure tunnel is needed.
- Requires a Letta API Plan for API-key (Bearer) auth used by automated/scripted runs. (Personal/Pro/Max plans use interactive OAuth and forbid automated use.)
- Provider/model API keys live in Letta via BYOK (bring your own keys), never in this adapter or the repo. The adapter only observes providerConfigured and never reads or stores keys.

Alternate A — Local, same machine:
- An existing local Letta on http://127.0.0.1:8283, only reachable when the Paperclip server runs on the same machine.
- Good for local proof; reuse an existing Letta agent and its memory by agentId.

Alternate B — Self-host behind Cloudflare Access (dormant):
- A protected remote Letta you operate, reached with cfAccessClientId/cfAccessClientSecret service-token headers (or custom headers).
- Reserved fallback if you decide to leave Letta Cloud; not the default path.

Use when:
- You want the Paperclip agent to reuse a persistent Letta agent and its memory
- You want provider/model routing and API keys to live in Letta, not Paperclip

Don't use when:
- No Letta backend (cloud or local) is reachable over HTTP from the Paperclip host
- You want one-shot CLI execution with no persistent memory (use process/http)

Core fields:
- agentId (string, required): id of an existing Letta agent (e.g. agent-...). This is the memory anchor; reusing it preserves memory across runs.
- baseUrl (string, optional): Letta server URL. Use https://api.letta.com for Letta Cloud (Mode 1). Defaults to LETTA_BASE_URL env, then http://127.0.0.1:8283 (local).
- token (string, optional): bearer token. For Letta Cloud this is your LETTA_API_KEY (sent as Authorization: Bearer); for a self-hosted server it is the server password. Defaults to LETTA_API_KEY env.
- cfAccessClientId / cfAccessClientSecret (string, optional): Cloudflare Access service-token credentials for a protected remote Letta (Mode 3). Default to CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET env. Sent as CF-Access-Client-Id / CF-Access-Client-Secret headers.
- headers (object, optional): arbitrary extra request headers (custom gateways / proxies).
- model (string, optional): Letta model handle to request for the turn (e.g. letta/auto).
- promptTemplate (string, optional): {{taskTitle}}/{{taskBody}}/{{wakeReason}} template for the user message.
- timeoutSec (number, optional): per-run timeout in seconds (default 300).
- receiptRef (string, optional): v2 placeholder, carried through to resultJson for the future otto culture plugin. Unused in v1.

Notes:
- The adapter POSTs the run prompt to /v1/agents/{agentId}/messages and returns the assistant message + token usage.
- Provider API keys belong in Letta. This adapter only observes providerConfigured (whether Letta returns models); it never reads or stores keys.
`;

// Required by Paperclip's plugin-loader convention: the package root must
// re-export createServerAdapter.
export { createServerAdapter } from "./server/index.js";
