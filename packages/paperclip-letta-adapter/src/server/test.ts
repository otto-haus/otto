import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "../contract.js";
import { lettaFetch, parseModels, resolveAuthHeaders, resolveBaseUrl, resolveToken } from "./letta-client.js";

function asString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const baseUrl = resolveBaseUrl(ctx.config);
  const token = resolveToken(ctx.config);
  const headers = resolveAuthHeaders(ctx.config);
  const agentId = asString(ctx.config.agentId) || asString(ctx.config.lettaAgentId);

  checks.push({
    level: "info",
    code: "base_url",
    message: `Letta base URL: ${baseUrl}`,
  });

  const models = await lettaFetch(baseUrl, "/v1/models/", { token, headers, timeoutSec: 15 });
  if (!models.ok) {
    checks.push({
      level: "error",
      code: "letta_unreachable",
      message: models.timedOut
        ? `Letta server did not respond at ${baseUrl}`
        : `Could not reach Letta server at ${baseUrl}${models.status ? ` (HTTP ${models.status})` : ""}`,
      detail: models.error ?? null,
      hint: "Start the embedded Letta backend or Letta Desktop, or set adapterConfig.baseUrl / LETTA_BASE_URL.",
    });
  } else {
    const modelList = parseModels(models.json);
    if (modelList.length === 0) {
      checks.push({
        level: "warn",
        code: "no_models",
        message: "Letta is reachable but returned no models.",
        hint: "Add a provider API key inside Letta (keys live in Letta, not in otto/Paperclip).",
      });
    } else {
      checks.push({
        level: "info",
        code: "provider_configured",
        message: `Letta reachable: ${modelList.length} model(s) available (providerConfigured: true). Keys live in Letta; this adapter never inspects them.`,
      });
    }
  }

  if (!agentId) {
    checks.push({
      level: "error",
      code: "no_agent_id",
      message: "No Letta agent id configured.",
      hint: "Set adapterConfig.agentId to an existing Letta agent so otto keeps its memory.",
    });
  } else if (models.ok) {
    const agent = await lettaFetch(baseUrl, `/v1/agents/${encodeURIComponent(agentId)}`, {
      token,
      headers,
      timeoutSec: 15,
    });
    if (agent.ok) {
      checks.push({
        level: "info",
        code: "agent_found",
        message: `Letta agent ${agentId} found.`,
      });
    } else if (agent.status === 404) {
      checks.push({
        level: "error",
        code: "agent_not_found",
        message: `Letta agent ${agentId} was not found at ${baseUrl}.`,
        hint: "Use the id of an existing Letta agent to preserve memory continuity.",
      });
    } else {
      checks.push({
        level: "warn",
        code: "agent_check_failed",
        message: `Could not verify Letta agent ${agentId}${agent.status ? ` (HTTP ${agent.status})` : ""}.`,
        detail: agent.error ?? null,
      });
    }
  }

  const status = checks.some((c) => c.level === "error")
    ? "fail"
    : checks.some((c) => c.level === "warn")
      ? "warn"
      : "pass";

  return {
    adapterType: ctx.adapterType,
    status,
    checks,
    testedAt: new Date().toISOString(),
  };
}
