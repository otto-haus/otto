import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ConfigStore } from '../config-store';
import type { LettaModelOption } from '../shared/types';

export type LocalLettaContext = {
  baseUrl: string | null;
  agentId: string | null;
  agentCandidates: string[];
  source: string;
  reason?: string;
};

type LettaSettings = {
  lastAgent?: string;
  preferredBackendMode?: string;
  sessionsByServer?: Record<string, { agentId?: string; conversationId?: string }>;
  agents?: Array<{ agentId?: string; baseUrl?: string }>;
};

export function discoverLocalLettaContext(config: ConfigStore): LocalLettaContext {
  const settings = readLettaSettings();
  const configuredBase = config.baseUrl();
  const discoveredUrl = normalizeBaseUrl(configuredBase) ?? discoverLocalLettaUrl() ?? discoverSettingsHttpBaseUrl(settings);
  const settingsAgent = discoverSettingsAgentId(settings, discoveredUrl);
  const agentCandidates = unique([...config.agentCandidates(), settingsAgent]);
  const source = configuredBase || process.env.OTTO_AGENT_ID || config.get().agentId
    ? 'otto config/env'
    : agentCandidates.length || discoveredUrl
      ? 'Letta local settings/discovery'
      : 'none';
  return {
    baseUrl: discoveredUrl,
    agentId: agentCandidates[0] ?? null,
    agentCandidates,
    source,
    reason: agentCandidates.length === 0 ? 'no last local agent or session was found in ~/.letta/settings.json' : undefined,
  };
}

function readLettaSettings(): LettaSettings | null {
  try {
    const settingsPath = process.env.OTTO_LETTA_SETTINGS_PATH || join(homedir(), '.letta', 'settings.json');
    return JSON.parse(readFileSync(settingsPath, 'utf8')) as LettaSettings;
  } catch {
    return null;
  }
}

export function normalizeBaseUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^local:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  if (/^(localhost|127\.0\.0\.1):\d+$/i.test(trimmed)) return `http://${trimmed.replace(/\/+$/, '')}`;
  return null;
}

/** Map `local:` or missing base URLs to a loopback HTTP endpoint for read-only fetches (047). */
export function resolveHttpBaseUrl(configured?: string | null): string | null {
  const direct = normalizeBaseUrl(configured);
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  const fromSettings = discoverSettingsHttpBaseUrl(readLettaSettings());
  if (fromSettings && /^https?:\/\//i.test(fromSettings)) return fromSettings;
  return discoverLocalLettaUrl();
}

export async function listLocalLettaModels(config: ConfigStore): Promise<LettaModelOption[]> {
  const base = resolveHttpBaseUrl(config.baseUrl());
  if (!base) return [];
  const res = await fetch(`${base}/v1/models/`);
  if (!res.ok) throw new Error(`Could not list Letta models (${res.status})`);
  const raw = await res.json() as unknown;
  const rows = modelRows(raw);
  const seen = new Set<string>();
  const out: LettaModelOption[] = [];
  for (const row of rows) {
    const handle = modelHandle(row);
    if (!handle || seen.has(handle)) continue;
    seen.add(handle);
    const label = modelLabel(row, handle);
    out.push({
      handle,
      label,
      provider: stringField(row, 'provider_name') ?? stringField(row, 'provider_type'),
      displayName: stringField(row, 'display_name') ?? stringField(row, 'name'),
    });
  }
  return out;
}

export async function confirmedModelHandle(config: ConfigStore): Promise<string | null> {
  const models = await listLocalLettaModels(config);
  if (!models.length) return config.modelHandle();
  const preferred = config.modelHandle();
  if (preferred && models.some((model) => model.handle === preferred)) return preferred;
  return models.find((model) => model.handle === 'letta/auto')?.handle
    ?? models.find((model) => model.handle === 'openai/gpt-5.5')?.handle
    ?? models[0]?.handle
    ?? null;
}

function discoverSettingsHttpBaseUrl(settings: LettaSettings | null): string | null {
  if (!settings) return null;
  const sessionKeys = Object.keys(settings.sessionsByServer ?? {});
  const agentBases = (settings.agents ?? []).map((a) => a.baseUrl).filter(Boolean) as string[];
  for (const candidate of [...sessionKeys, ...agentBases]) {
    const url = normalizeBaseUrl(candidate);
    if (url) return url;
  }
  return null;
}

function discoverSettingsAgentId(settings: LettaSettings | null, baseUrl: string | null): string | null {
  if (!settings) return null;
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const sessions = settings.sessionsByServer ?? {};

  if (normalizedBase) {
    for (const [server, session] of Object.entries(sessions)) {
      if (normalizeBaseUrl(server) === normalizedBase && session.agentId) return session.agentId;
    }
  }

  const localSession = Object.entries(sessions).find(([server, session]) =>
    !!session.agentId && (server.startsWith('local:') || !!normalizeBaseUrl(server)),
  );
  if (localSession?.[1].agentId) return localSession[1].agentId;

  if (settings.lastAgent?.startsWith('agent-')) return settings.lastAgent;

  const localAgent = (settings.agents ?? []).find((a) =>
    a.agentId?.startsWith('agent-') && (!a.baseUrl || a.baseUrl.startsWith('local:') || !!normalizeBaseUrl(a.baseUrl)),
  );
  return localAgent?.agentId ?? null;
}

function modelRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  for (const key of ['data', 'models', 'items']) {
    const value = raw[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function modelHandle(row: Record<string, unknown>): string | null {
  return stringField(row, 'handle') ?? stringField(row, 'id') ?? stringField(row, 'model');
}

function modelLabel(row: Record<string, unknown>, handle: string): string {
  const display = stringField(row, 'display_name') ?? stringField(row, 'name');
  if (display && display !== handle) return display;
  return handle;
}

function stringField(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function discoverLocalLettaUrl(): string | null {
  if (process.env.OTTO_SKIP_LETTA_LSOF === '1') return null;
  if (process.platform !== 'darwin') return null;
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], {
      timeout: 3000,
      encoding: 'utf8',
    });
    for (const line of out.split('\n')) {
      if (!/letta/i.test(line)) continue;
      const m = line.match(/(?:127\.0\.0\.1|localhost):(\d+)/i);
      if (m) return `http://127.0.0.1:${m[1]}`;
    }
  } catch {
    // lsof unavailable
  }
  return null;
}

function unique(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}
