import type { ConfigStore } from './config-store';
import { resolveLettaApiKey } from './letta-api-key';
import {
  listLocalLettaModels,
  resolveHttpBaseUrl,
} from './runtime-transport/letta-discovery';
import type {
  ByokConnectProviderId,
  ProviderConnectInput,
  ProviderConnectResult,
  ProviderMirrorRow,
  ProviderMirrorSnapshot,
} from './shared/types';

export type LettaProviderRecord = {
  id?: string;
  name?: string;
  provider_type?: string;
  provider_category?: string;
};

type ByokConnectSpec = {
  id: ByokConnectProviderId;
  displayName: string;
  providerType: string;
  providerName: string;
  handlePrefixes: string[];
  requiresApiKey?: boolean;
  requiresBaseUrl?: boolean;
  optionalApiKey?: boolean;
  defaultBaseUrl?: string;
};

export const BYOK_CONNECT_SPECS: ByokConnectSpec[] = [
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    providerType: 'openrouter',
    providerName: 'lc-openrouter',
    handlePrefixes: ['openrouter/'],
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    providerType: 'ollama',
    providerName: 'lc-ollama',
    handlePrefixes: ['ollama/'],
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
  },
  {
    id: 'lmstudio',
    displayName: 'LM Studio',
    providerType: 'lmstudio_openai',
    providerName: 'lc-lmstudio',
    handlePrefixes: ['lmstudio_openai/'],
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
  },
  {
    id: 'openai_compat',
    displayName: 'OpenAI-compatible',
    providerType: 'openai',
    providerName: 'lc-custom-openai',
    handlePrefixes: ['openai-proxy/'],
    requiresBaseUrl: true,
    optionalApiKey: true,
  },
];

export function getByokConnectSpec(id: ByokConnectProviderId): ByokConnectSpec | undefined {
  return BYOK_CONNECT_SPECS.find((spec) => spec.id === id);
}

function providerRows(raw: unknown): LettaProviderRecord[] {
  if (Array.isArray(raw)) return raw.filter((row): row is LettaProviderRecord => !!row && typeof row === 'object');
  if (raw && typeof raw === 'object') {
    for (const key of ['data', 'providers', 'items']) {
      const value = (raw as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value.filter((row): row is LettaProviderRecord => !!row && typeof row === 'object');
    }
  }
  return [];
}

function lettaAuthHeaders(config: ConfigStore): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = resolveLettaApiKey(config);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

async function lettaRequest(
  config: ConfigStore,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: unknown; errorText?: string }> {
  const baseUrl = resolveHttpBaseUrl(config.baseUrl(), config);
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    return { ok: false, status: 0, data: null, errorText: 'Letta runtime URL is not reachable.' };
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: lettaAuthHeaders(config),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    errorText: response.ok ? undefined : (typeof data === 'object' && data && 'detail' in data
      ? String((data as { detail: unknown }).detail)
      : text.slice(0, 240) || `Letta provider API returned ${response.status}`),
  };
}

export async function listLettaProviders(config: ConfigStore): Promise<LettaProviderRecord[]> {
  const result = await lettaRequest(config, 'GET', '/v1/providers/');
  if (!result.ok) return [];
  return providerRows(result.data);
}

function rowStatus(
  spec: ByokConnectSpec,
  providers: LettaProviderRecord[],
  modelPrefixes: string[],
): ProviderMirrorRow['status'] {
  const registered = providers.some((provider) =>
    provider.name === spec.providerName || provider.provider_type === spec.providerType,
  );
  const hasModels = spec.handlePrefixes.some((prefix) => modelPrefixes.some((handle) => handle.startsWith(prefix)));
  if (registered || hasModels) return 'connected';
  return 'missing';
}

export function buildProviderMirrorRows(
  providers: LettaProviderRecord[],
  modelHandles: string[],
): ProviderMirrorRow[] {
  const checkedAt = new Date().toISOString();
  return BYOK_CONNECT_SPECS.map((spec) => ({
    id: spec.id,
    displayName: spec.displayName,
    status: rowStatus(spec, providers, modelHandles),
    connected: rowStatus(spec, providers, modelHandles) === 'connected',
    lastVerifiedAt: checkedAt,
  }));
}

export async function buildProviderMirror(
  config: ConfigStore,
  runtimeReady = false,
): Promise<ProviderMirrorSnapshot> {
  const base: ProviderMirrorSnapshot = {
    lettaConnected: runtimeReady,
    lettaConfigured: !!resolveHttpBaseUrl(config.baseUrl(), config),
    hasApiKey: !!resolveLettaApiKey(config),
    modelHandle: config.modelHandle(),
    agentId: config.agentId(),
    note: 'Provider auth is managed by Letta. otto never stores or reads back API keys.',
    providers: [],
    modelCount: 0,
  };

  if (!base.lettaConfigured) {
    base.providers = buildProviderMirrorRows([], []);
    return base;
  }

  const [providers, models] = await Promise.all([
    listLettaProviders(config).catch(() => [] as LettaProviderRecord[]),
    listLocalLettaModels(config).catch(() => []),
  ]);
  const handles = models.map((model) => model.handle);
  base.providers = buildProviderMirrorRows(providers, handles);
  base.modelCount = handles.length;
  return base;
}

function validateConnectInput(spec: ByokConnectSpec, input: ProviderConnectInput): string | null {
  if (spec.requiresApiKey && !input.apiKey?.trim()) return 'API key is required.';
  if (spec.requiresBaseUrl && !input.baseUrl?.trim()) return 'Base URL is required.';
  if (spec.id === 'openai_compat' && !input.baseUrl?.trim()) return 'Base URL is required.';
  return null;
}

function connectPayload(spec: ByokConnectSpec, input: ProviderConnectInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: spec.providerName,
    provider_type: spec.providerType,
  };
  const apiKey = input.apiKey?.trim();
  const baseUrl = (input.baseUrl?.trim() || spec.defaultBaseUrl || '').replace(/\/+$/, '');
  if (apiKey) payload.api_key = apiKey;
  if (baseUrl) payload.base_url = baseUrl;
  if (spec.optionalApiKey && !apiKey) payload.api_key = 'local';
  return payload;
}

async function refreshByokProviders(config: ConfigStore, providers: LettaProviderRecord[]): Promise<void> {
  await Promise.allSettled(
    providers
      .filter((provider) => provider.provider_category === 'byok' && provider.id)
      .map((provider) => lettaRequest(config, 'PATCH', `/v1/providers/${provider.id}/refresh`)),
  );
}

export async function connectByokProvider(
  config: ConfigStore,
  runtimeReady: boolean,
  input: ProviderConnectInput,
): Promise<ProviderConnectResult> {
  const spec = getByokConnectSpec(input.providerId);
  if (!spec) {
    const mirror = await buildProviderMirror(config, runtimeReady);
    return { ok: false, status: 'error', error: 'Unknown provider.', mirror, modelCount: mirror.modelCount ?? 0 };
  }

  const validationError = validateConnectInput(spec, input);
  if (validationError) {
    const mirror = await buildProviderMirror(config, runtimeReady);
    return { ok: false, status: 'error', error: validationError, mirror, modelCount: mirror.modelCount ?? 0 };
  }

  const existing = (await listLettaProviders(config)).find((provider) => provider.name === spec.providerName);
  const payload = connectPayload(spec, input);
  const write = existing?.id
    ? await lettaRequest(config, 'PATCH', `/v1/providers/${existing.id}`, payload)
    : await lettaRequest(config, 'POST', '/v1/providers/', payload);

  if (!write.ok) {
    const mirror = await buildProviderMirror(config, runtimeReady);
    return {
      ok: false,
      status: 'error',
      error: write.errorText ?? 'Provider connect failed.',
      mirror,
      modelCount: mirror.modelCount ?? 0,
    };
  }

  const providers = await listLettaProviders(config);
  await refreshByokProviders(config, providers);
  const mirror = await buildProviderMirror(config, runtimeReady);
  const row = mirror.providers.find((providerRow) => providerRow.id === spec.id);
  return {
    ok: true,
    status: row?.status === 'connected' ? 'connected' : 'missing',
    mirror,
    modelCount: mirror.modelCount ?? 0,
  };
}
