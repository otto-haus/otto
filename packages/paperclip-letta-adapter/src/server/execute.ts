import type { AdapterExecutionContext, AdapterExecutionResult } from "../contract.js";
import { lettaFetch, parseTurn, resolveAuthHeaders, resolveBaseUrl, resolveToken } from "./letta-client.js";

const DEFAULT_TIMEOUT_SEC = 300;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Minimal {{key}} substitution; no external template dependency. */
function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => data[key] ?? "");
}

/**
 * Build the user message handed to the Letta agent for this run. Prefers an
 * operator-supplied promptTemplate; otherwise composes a readable brief from the
 * Paperclip task/wake context.
 */
function buildPrompt(ctx: AdapterExecutionContext): string {
  const { config, context, agent, runId } = ctx;
  const taskId = asString(context.taskId) || asString(context.issueId);
  const taskTitle = asString(context.taskTitle) || asString(context.issueTitle);
  const taskBody = asString(context.taskBody) || asString(context.taskDescription) || asString(context.description);
  const wakeReason = asString(context.wakeReason);

  const template = asString(config.promptTemplate);
  if (template) {
    return renderTemplate(template, {
      agentId: agent.id,
      agentName: agent.name,
      companyId: agent.companyId,
      runId,
      taskId,
      taskTitle,
      taskBody,
      wakeReason,
    }).trim();
  }

  const lines: string[] = [];
  if (taskTitle) lines.push(`Task: ${taskTitle}`);
  if (taskId) lines.push(`Task id: ${taskId}`);
  if (wakeReason) lines.push(`Wake reason: ${wakeReason}`);
  if (taskBody) lines.push("", taskBody);
  if (lines.length === 0) lines.push("Continue your work and report what you did.");
  return lines.join("\n").trim();
}

function resolveAgentId(ctx: AdapterExecutionContext): string {
  const { config, runtime } = ctx;
  const fromSession =
    (runtime.sessionParams && typeof runtime.sessionParams.agentId === "string" && runtime.sessionParams.agentId.trim()) ||
    "";
  return fromSession || asString(config.agentId) || asString(config.lettaAgentId);
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { config, onLog, onSpawn } = ctx;
  const baseUrl = resolveBaseUrl(config);
  const token = resolveToken(config);
  const agentId = resolveAgentId(ctx);
  const timeoutSec = asNumber(config.timeoutSec, DEFAULT_TIMEOUT_SEC);
  const model = asString(config.model);
  // v2 placeholder: carried through to resultJson so the future otto culture
  // plugin can attach a receipt without changing the v1 contract. Unused in v1.
  const receiptRef = asString(config.receiptRef);

  if (!agentId) {
    const message =
      "No Letta agent id configured. Set adapterConfig.agentId to an existing Letta agent so otto keeps its memory.";
    await onLog("stderr", `[letta] ${message}\n`);
    return { exitCode: 1, signal: null, timedOut: false, errorMessage: message, clearSession: false };
  }

  const prompt = buildPrompt(ctx);
  await onLog("stdout", `[letta] Sending run to agent ${agentId} at ${baseUrl}\n`);
  if (onSpawn) {
    await onSpawn({ pid: process.pid, processGroupId: null, startedAt: new Date().toISOString() });
  }

  const body: Record<string, unknown> = {
    messages: [{ role: "user", content: prompt }],
  };
  if (model) body.model = model;

  const res = await lettaFetch(baseUrl, `/v1/agents/${encodeURIComponent(agentId)}/messages`, {
    method: "POST",
    body,
    token,
    headers: resolveAuthHeaders(config),
    timeoutSec,
  });

  if (res.timedOut) {
    await onLog("stderr", `[letta] Timed out after ${timeoutSec}s\n`);
    return {
      exitCode: null,
      signal: null,
      timedOut: true,
      errorMessage: `Timed out after ${timeoutSec}s`,
      model: model || null,
      provider: "letta",
    };
  }

  if (!res.ok) {
    const detail = res.error || firstLine(res.text) || `HTTP ${res.status}`;
    await onLog("stderr", `[letta] Request failed: ${detail}\n`);
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `Letta request failed: ${detail}`,
      model: model || null,
      provider: "letta",
    };
  }

  const turn = parseTurn(res.json);
  if (turn.assistantText) {
    await onLog("stdout", `${turn.assistantText}\n`);
  } else {
    await onLog("stdout", "[letta] Run completed with no assistant message.\n");
  }

  return {
    exitCode: 0,
    signal: null,
    timedOut: false,
    errorMessage: null,
    usage: turn.usage,
    summary: turn.assistantText || null,
    provider: "letta",
    model: model || null,
    sessionId: agentId,
    sessionParams: { agentId },
    sessionDisplayId: agentId,
    resultJson: { agentId, baseUrl, ...(receiptRef ? { receiptRef } : {}) },
  };
}

function firstLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}
