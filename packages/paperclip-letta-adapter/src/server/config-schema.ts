import type { AdapterConfigSchema } from "../contract.js";
import { DEFAULT_LETTA_BASE_URL } from "./letta-client.js";

/**
 * Declarative config form for the letta_local adapter, rendered by Paperclip
 * when creating/editing an agent. The required field is `agentId` (the Letta
 * memory anchor); `baseUrl`/`token` default to Letta Cloud + the LETTA_API_KEY
 * env. Provider/model keys live in Letta, never here.
 */
export function getConfigSchema(): AdapterConfigSchema {
  return {
    fields: [
      {
        key: "agentId",
        label: "Letta agent ID",
        type: "text",
        required: true,
        group: "Connection",
        hint: "Existing Letta agent to drive (e.g. agent-...). This is the memory anchor; reusing it preserves memory across runs.",
      },
      {
        key: "baseUrl",
        label: "Letta base URL",
        type: "text",
        default: "https://api.letta.com",
        group: "Connection",
        hint: `Letta server URL. Use https://api.letta.com for Letta Cloud. Defaults to LETTA_BASE_URL env, then ${DEFAULT_LETTA_BASE_URL} (local).`,
      },
      {
        key: "token",
        label: "Letta API key / token",
        type: "text",
        group: "Connection",
        hint: "For Letta Cloud this is your LETTA_API_KEY (sent as Authorization: Bearer). Leave blank to use the LETTA_API_KEY env / Secrets store. For a self-hosted server it is the server password.",
      },
      {
        key: "model",
        label: "Model handle",
        type: "text",
        default: "letta/auto",
        group: "Advanced",
        hint: "Optional Letta model handle to request for the turn (e.g. letta/auto).",
      },
      {
        key: "promptTemplate",
        label: "Prompt template",
        type: "textarea",
        group: "Advanced",
        hint: "Optional {{taskTitle}} / {{taskBody}} / {{wakeReason}} template for the user message.",
      },
      {
        key: "timeoutSec",
        label: "Timeout (seconds)",
        type: "number",
        default: 300,
        group: "Advanced",
        hint: "Per-run timeout in seconds.",
      },
      {
        key: "cfAccessClientId",
        label: "Cloudflare Access client ID",
        type: "text",
        group: "Advanced",
        hint: "Only for a self-hosted Letta behind Cloudflare Access. Sent as CF-Access-Client-Id. Defaults to CF_ACCESS_CLIENT_ID env.",
      },
      {
        key: "cfAccessClientSecret",
        label: "Cloudflare Access client secret",
        type: "text",
        group: "Advanced",
        hint: "Only for a self-hosted Letta behind Cloudflare Access. Sent as CF-Access-Client-Secret. Defaults to CF_ACCESS_CLIENT_SECRET env.",
      },
      {
        key: "headers",
        label: "Extra headers (JSON)",
        type: "textarea",
        group: "Advanced",
        hint: "Optional JSON object of arbitrary extra request headers (custom gateways / proxies).",
      },
      {
        key: "receiptRef",
        label: "Receipt ref (v2 placeholder)",
        type: "text",
        group: "Advanced",
        hint: "Carried through to resultJson for the future otto culture plugin. Unused in v1.",
      },
    ],
  };
}
