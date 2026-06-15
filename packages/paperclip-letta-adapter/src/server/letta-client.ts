/**
 * Tiny REST client for a Letta server.
 *
 * v1 deliberately talks to an already-running local Letta backend over HTTP and
 * drives an existing Letta agent by id. That preserves memory continuity: the
 * Paperclip agent reuses the same persistent Letta agent (and its memory)
 * rather than spawning a fresh, amnesiac one. Provider/API keys live in Letta,
 * never here.
 */

import type { AdapterModel, UsageSummary } from "../contract.js";

export const DEFAULT_LETTA_BASE_URL = "http://127.0.0.1:8283";

export function normalizeBaseUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
    return `http://${trimmed.replace(/\/+$/, "")}`;
  }
  return null;
}

/** Resolve the Letta base URL from adapter config, env, then loopback default. */
export function resolveBaseUrl(config?: Record<string, unknown>): string {
  const fromConfig = typeof config?.baseUrl === "string" ? normalizeBaseUrl(config.baseUrl) : null;
  const fromEnv = normalizeBaseUrl(process.env.LETTA_BASE_URL ?? process.env.OTTO_LETTA_BASE_URL);
  return fromConfig ?? fromEnv ?? DEFAULT_LETTA_BASE_URL;
}

/** Resolve an optional bearer token (local servers are usually open). */
export function resolveToken(config?: Record<string, unknown>): string | null {
  const fromConfig =
    (typeof config?.token === "string" && config.token.trim()) ||
    (typeof config?.apiKey === "string" && config.apiKey.trim()) ||
    "";
  const fromEnv = (process.env.LETTA_API_KEY ?? process.env.LETTA_SERVER_PASSWORD ?? "").trim();
  return fromConfig || fromEnv || null;
}

function configString(config: Record<string, unknown> | undefined, key: string): string {
  const value = config?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/**
 * Cloudflare Access service-token headers, for a protected remote Letta
 * (a cloud Paperclip -> a protected remote Letta behind Cloudflare Access).
 * Never expose an unauthenticated Letta runtime to the open internet.
 */
export function resolveAccessHeaders(config?: Record<string, unknown>): Record<string, string> {
  const id = configString(config, "cfAccessClientId") || (process.env.CF_ACCESS_CLIENT_ID ?? "").trim();
  const secret =
    configString(config, "cfAccessClientSecret") || (process.env.CF_ACCESS_CLIENT_SECRET ?? "").trim();
  return id && secret ? { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret } : {};
}

/** Arbitrary extra headers passthrough (e.g. mTLS proxy headers, custom gateways). */
export function resolveExtraHeaders(config?: Record<string, unknown>): Record<string, string> {
  const raw = config?.headers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

/** All non-bearer auth/gateway headers the Letta endpoint may require. */
export function resolveAuthHeaders(config?: Record<string, unknown>): Record<string, string> {
  return { ...resolveAccessHeaders(config), ...resolveExtraHeaders(config) };
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface LettaFetchResult {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
  timedOut: boolean;
  error?: string;
}

export async function lettaFetch(
  baseUrl: string,
  pathname: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
    timeoutSec?: number;
  } = {},
): Promise<LettaFetchResult> {
  const controller = new AbortController();
  const timeoutMs = Math.max(1, init.timeoutSec ?? 60) * 1000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${baseUrl}${pathname}`;
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeaders(init.token ?? null),
        ...(init.headers ?? {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text, timedOut: false };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: 0,
      json: null,
      text: "",
      timedOut: aborted,
      error: aborted ? `Request to ${url} timed out after ${timeoutMs / 1000}s` : describeError(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function rows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  for (const key of ["data", "models", "items", "messages"]) {
    const value = raw[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function stringField(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function numberField(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function parseModels(raw: unknown): AdapterModel[] {
  const out: AdapterModel[] = [];
  const seen = new Set<string>();
  for (const row of rows(raw)) {
    const id = stringField(row, "handle", "id", "model");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const label = stringField(row, "display_name", "name") ?? id;
    out.push({ id, label });
  }
  return out;
}

/** ServerAdapterModule.listModels has no args, so it reads env-configured base only. */
export async function listLettaModels(): Promise<AdapterModel[]> {
  const baseUrl = resolveBaseUrl();
  const token = resolveToken();
  const res = await lettaFetch(baseUrl, "/v1/models/", { token, headers: resolveAuthHeaders(), timeoutSec: 15 });
  if (!res.ok) return [];
  return parseModels(res.json);
}

export interface LettaTurn {
  assistantText: string;
  reasoningText: string;
  usage: UsageSummary;
  raw: unknown;
}

/**
 * Extract assistant output + usage from a Letta /messages response.
 * Handles both the array-of-messages shape and the { messages, usage } shape
 * across Letta server versions; parses defensively (agent output is untrusted).
 */
export function parseTurn(raw: unknown): LettaTurn {
  const messages = rows(raw);
  const assistantParts: string[] = [];
  const reasoningParts: string[] = [];
  let usage: UsageSummary = { inputTokens: 0, outputTokens: 0 };

  for (const msg of messages) {
    const messageType = stringField(msg, "message_type", "type");
    const content = extractContent(msg.content);
    if (messageType === "assistant_message" && content) assistantParts.push(content);
    else if (messageType === "reasoning_message" && content) reasoningParts.push(content);
    else if (messageType === "usage_statistics") {
      usage = readUsage(msg) ?? usage;
    }
  }

  if (isRecord(raw) && isRecord(raw.usage)) {
    usage = readUsage(raw.usage) ?? usage;
  }

  return {
    assistantText: assistantParts.join("\n\n").trim(),
    reasoningText: reasoningParts.join("\n\n").trim(),
    usage,
    raw,
  };
}

function readUsage(row: Record<string, unknown>): UsageSummary | null {
  const inputTokens = numberField(row, "prompt_tokens", "input_tokens", "inputTokens");
  const outputTokens = numberField(row, "completion_tokens", "output_tokens", "outputTokens");
  if (inputTokens === null && outputTokens === null) return null;
  return { inputTokens: inputTokens ?? 0, outputTokens: outputTokens ?? 0 };
}

function extractContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (isRecord(part) && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  if (isRecord(content) && typeof content.text === "string") return content.text.trim();
  return "";
}
