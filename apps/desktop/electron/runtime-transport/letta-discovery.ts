import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ConfigStore } from '../config-store';
import { applyEmbeddedLettaSettingsEnv, resolveLettaSettingsPath } from '../dream-settings';
import type { LettaModelOption } from '../shared/types';
import type { ConnectionMode } from './runtime-common';

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
  applyEmbeddedLettaSettingsEnv(config);
  const settings = readLettaSettings(config);
  const configuredBase = config.baseUrl();
  const discoveredUrl = normalizeBaseUrl(configuredBase) ?? discoverLocalLettaUrl() ?? discoverSettingsHttpBaseUrl(settings);
  return buildLocalLettaContext(config, settings, configuredBase, discoveredUrl);
}

/**
 * Liveness-aware variant of {@link discoverLocalLettaContext} used on the connection path.
 *
 * The sync resolver trusts a persisted `baseUrl` first, so a stale/dead port (e.g. a Letta
 * Desktop server that has since restarted on a new port) short-circuits live discovery and otto
 * never reconnects. Here we probe each candidate `/v1/health/` and prefer the first reachable HTTP
 * endpoint, falling back to a live `lsof`/settings-discovered server when the persisted one is dead.
 * Embedded (`local:`) targets and the no-candidate case behave exactly like the sync resolver.
 */
export async function resolveLiveLocalLettaContext(config: ConfigStore): Promise<LocalLettaContext> {
  applyEmbeddedLettaSettingsEnv(config);
  const settings = readLettaSettings(config);
  const configuredBase = config.baseUrl();
  const normalizedConfigured = normalizeBaseUrl(configuredBase);

  const candidates = unique([
    normalizedConfigured,
    ...discoverLocalLettaUrls(),
    discoverSettingsHttpBaseUrl(settings),
  ]);
  const httpCandidates = candidates.filter((url) => /^https?:\/\//i.test(url));
  const connectionMode = config.connectionMode();
  const loopbackHttpCandidates = httpCandidates.filter((url) =>
    /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(url),
  );
  const probeCandidates =
    connectionMode === 'embedded' ? loopbackHttpCandidates : httpCandidates;

  // Nothing to probe (embedded `local:` target or no HTTP candidate) — keep sync behavior.
  if (probeCandidates.length === 0) {
    const discoveredUrl = candidates[0] ?? null;
    if (
      connectionMode === 'embedded' &&
      discoveredUrl &&
      /^https?:\/\//i.test(discoveredUrl) &&
      !/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(discoveredUrl)
    ) {
      return buildLocalLettaContext(config, settings, configuredBase, null);
    }
    return buildLocalLettaContext(config, settings, configuredBase, discoveredUrl);
  }

  const liveUrl = await firstReachableBaseUrl(probeCandidates);
  // Embedded boot must not pin to a dead loopback override when nothing local is reachable.
  if (
    !liveUrl &&
    connectionMode === 'embedded' &&
    !candidates.some((url) => url && /^local:/i.test(url))
  ) {
    return buildLocalLettaContext(config, settings, configuredBase, null);
  }
  // If none are reachable, keep the first candidate so error messaging still has context.
  const discoveredUrl = liveUrl ?? candidates[0] ?? null;
  const staleRecovered =
    !!liveUrl && !!normalizedConfigured && /^https?:\/\//i.test(normalizedConfigured) && liveUrl !== normalizedConfigured;
  return buildLocalLettaContext(config, settings, configuredBase, discoveredUrl, { staleRecovered });
}

function buildLocalLettaContext(
  config: ConfigStore,
  settings: LettaSettings | null,
  configuredBase: string | null,
  discoveredUrl: string | null,
  opts?: { staleRecovered?: boolean },
): LocalLettaContext {
  const settingsAgent = discoverSettingsAgentId(settings, discoveredUrl);
  const agentCandidates = unique([...config.agentCandidates(), settingsAgent]);
  const source = opts?.staleRecovered
    ? 'live Letta discovery (recovered from stale base URL)'
    : configuredBase || process.env.OTTO_AGENT_ID || config.get().agentId
      ? 'otto config/env'
      : agentCandidates.length || discoveredUrl
        ? 'Letta local settings/discovery'
        : 'none';
  return {
    baseUrl: discoveredUrl,
    agentId: agentCandidates[0] ?? null,
    agentCandidates,
    source,
    reason: agentCandidates.length === 0
      ? 'No last local agent or session was found in Letta settings.'
      : undefined,
  };
}

/** Probe a Letta HTTP endpoint's health route with a short timeout. */
export async function probeLettaHealth(baseUrl: string, timeoutMs = 1500): Promise<boolean> {
  if (!/^https?:\/\//i.test(baseUrl)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/v1/health/`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function firstReachableBaseUrl(urls: string[], timeoutMs = 1500): Promise<string | null> {
  for (const url of urls) {
    if (await probeLettaHealth(url, timeoutMs)) return url;
  }
  return null;
}

function readLettaSettingsFromEnv(): LettaSettings | null {
  try {
    const settingsPath = process.env.OTTO_LETTA_SETTINGS_PATH?.trim() || join(homedir(), '.letta', 'settings.json');
    return JSON.parse(readFileSync(settingsPath, 'utf8')) as LettaSettings;
  } catch {
    return null;
  }
}

function readLettaSettings(config: ConfigStore): LettaSettings | null {
  try {
    const settingsPath = resolveLettaSettingsPath(config, config.connectionMode());
    return JSON.parse(readFileSync(settingsPath, 'utf8')) as LettaSettings;
  } catch {
    return null;
  }
}

export type InitBaseUrlResolution = {
  baseUrl: string | null;
  /** When true, LETTA_BASE_URL must be unset so bundled CLI can spawn a standalone backend. */
  omitBaseUrl?: boolean;
  /** When set, skip SDK init and return unreachable immediately. */
  blockReason?: string;
  /** When true, clear a persisted dead loopback override from otto config before init. */
  clearStaleOverride?: boolean;
};

const LETTA_HTTP_PROBE_TIMEOUT_MS = 3_000;

/** Short-timeout readiness probe for a loopback Letta HTTP base URL. */
export async function probeLettaHttpBaseUrl(baseUrl: string): Promise<boolean> {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized || !/^https?:\/\//i.test(normalized)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LETTA_HTTP_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${normalized}/v1/models/`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** True when a Letta process is listening on loopback (Letta Desktop open or embedded backend up). */
export function isLocalLettaBackendListening(): boolean {
  return discoverLocalLettaUrl() !== null;
}

/**
 * Resolve LETTA_BASE_URL for session init.
 * - existing + local: backend down → block with Settings guidance (no infinite hang).
 * - embedded + local: backend down → omit URL so bundled CLI can spawn standalone backend.
 */
export async function resolveInitBaseUrl(
  configured: string | null | undefined,
  connectionMode: ConnectionMode,
): Promise<InitBaseUrlResolution> {
  const normalized = normalizeBaseUrl(configured);
  if (!normalized) return { baseUrl: null };

  const isLocalScheme = /^local:/i.test(normalized);
  const isLoopbackHttp = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(normalized);

  if (isLoopbackHttp) {
    if (await probeLettaHttpBaseUrl(normalized)) {
      return { baseUrl: normalized };
    }
    if (connectionMode === 'embedded') {
      return { baseUrl: null, omitBaseUrl: true, clearStaleOverride: true };
    }
    if (connectionMode === 'existing') {
      return {
        baseUrl: normalized,
        blockReason:
          'Local Letta backend is not running. Open Letta Desktop once, or switch Connection mode to Embedded in Settings.',
      };
    }
    return { baseUrl: normalized };
  }

  if (isLocalScheme && !isLocalLettaBackendListening()) {
    if (connectionMode === 'embedded') {
      return { baseUrl: null, omitBaseUrl: true };
    }
    if (connectionMode === 'existing') {
      return {
        baseUrl: normalized,
        blockReason:
          'Local Letta backend is not running. Open Letta Desktop once, or switch Connection mode to Embedded in Settings.',
      };
    }
  }

  // Embedded must never pin to Letta Cloud or other remote HTTP — that forces LETTA_API_KEY
  // and breaks "This Mac" standalone boot when host env still carries cloud LETTA_BASE_URL.
  if (connectionMode === 'embedded' && /^https?:\/\//i.test(normalized) && !isLoopbackHttp) {
    return { baseUrl: null, omitBaseUrl: true, clearStaleOverride: true };
  }

  return { baseUrl: normalized };
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
export function resolveHttpBaseUrl(configured?: string | null, config?: ConfigStore): string | null {
  const direct = normalizeBaseUrl(configured);
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  if (config) applyEmbeddedLettaSettingsEnv(config);
  const fromSettings = discoverSettingsHttpBaseUrl(
    config ? readLettaSettings(config) : readLettaSettingsFromEnv(),
  );
  if (fromSettings && /^https?:\/\//i.test(fromSettings)) return fromSettings;
  return discoverLocalLettaUrl();
}

export async function listLocalLettaModels(config: ConfigStore): Promise<LettaModelOption[]> {
  const base = resolveHttpBaseUrl(config.baseUrl(), config);
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
      deprecated: modelDeprecated(row),
      providerCategory: modelProviderCategory(row),
    });
  }
  return out;
}

export type ResolvedModelHandle = {
  /** User's persisted selection — never rewritten by discovery/fallback. */
  requested: string | null;
  /** Model handle passed to the runtime for this session/turn. */
  active: string | null;
  /** Human-readable reason when active differs from requested. */
  fallbackReason: string | null;
};

export function resolveModelHandle(preferred: string | null, models: LettaModelOption[]): ResolvedModelHandle {
  const requested = preferred;
  if (!models.length) {
    return { requested, active: requested, fallbackReason: null };
  }
  if (requested && models.some((model) => model.handle === requested)) {
    return { requested, active: requested, fallbackReason: null };
  }
  const fallback = models.find((model) => model.handle === 'letta/auto')
    ?? models.find((model) => model.handle === 'openai/gpt-5.5')
    ?? models[0];
  const active = fallback?.handle ?? null;
  const fallbackReason = requested && active && requested !== active
    ? `Requested ${requested} is not in Letta's model catalog for this session — often a BYOK validation or discovery gap upstream. Running ${active} instead. Your selection stays saved.`
    : null;
  return { requested, active, fallbackReason };
}

export async function confirmedModelHandle(config: ConfigStore): Promise<ResolvedModelHandle> {
  const models = await listLocalLettaModels(config).catch(() => [] as LettaModelOption[]);
  return resolveModelHandle(config.modelHandle(), models);
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

function modelDeprecated(row: Record<string, unknown>): boolean {
  if (row.deprecated === true || row.is_deprecated === true) return true;
  const status = stringField(row, 'status') ?? stringField(row, 'availability');
  return status === 'deprecated' || status === 'unavailable';
}

function modelProviderCategory(row: Record<string, unknown>): 'base' | 'byok' | null {
  const category = stringField(row, 'provider_category');
  if (category === 'base' || category === 'byok') return category;
  return null;
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

export function discoverLocalLettaUrl(): string | null {
  return discoverLocalLettaUrls()[0] ?? null;
}

/** All loopback ports currently held by a listening Letta process (macOS `lsof`). */
function discoverLocalLettaUrls(): string[] {
  if (process.env.OTTO_SKIP_LETTA_LSOF === '1') return [];
  if (process.platform !== 'darwin') return [];
  const urls: string[] = [];
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], {
      timeout: 3000,
      encoding: 'utf8',
    });
    for (const line of out.split('\n')) {
      if (!/letta/i.test(line)) continue;
      const m = line.match(/(?:127\.0\.0\.1|localhost):(\d+)/i);
      if (m) {
        const url = `http://127.0.0.1:${m[1]}`;
        if (!urls.includes(url)) urls.push(url);
      }
    }
  } catch {
    // lsof unavailable
  }
  return urls;
}

function unique(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}
