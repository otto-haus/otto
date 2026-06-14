import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode } from './shared/types';
import type { ConfigStore } from './config-store';
import { getSecret, hasSecret } from './secret-store';
import { TraceWriter } from './trace-writer';

type SDK = typeof import('@letta-ai/letta-code-sdk');
type Session = import('@letta-ai/letta-code-sdk').Session;
type CreateSessionOptions = import('@letta-ai/letta-code-sdk').CreateSessionOptions;

// Git-backed memfs is server/cloud-only — the local backend rejects it. Default OFF.
// Set OTTO_MEMFS=1 to force it on for backends that support it.
const WANT_MEMFS = process.env.OTTO_MEMFS === '1' || process.env.OTTO_MEMFS === 'true';
const SMOKE_MODE = process.env.OTTO_SMOKE === '1' || process.env.OTTO_SMOKE === 'true';

const LETTA_DESKTOP_CLI = '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

function resolveCli(): { cliPath: string; cliResolved: boolean } {
  const explicit = process.env.LETTA_CLI_PATH;
  if (explicit) return { cliPath: explicit, cliResolved: true };
  if (existsSync(LETTA_DESKTOP_CLI)) return { cliPath: LETTA_DESKTOP_CLI, cliResolved: true };
  return { cliPath: '(bundled @letta-ai/letta-code)', cliResolved: false };
}

const isNotFound = (e: unknown) => {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes('not found') || m.includes('not-found') || m.includes('agent-not-found');
};

/**
 * Single Otto session against a local Letta agent. Recovers from stale candidates by
 * trying local Letta's recent agents before surfacing a clean not-ready status.
 */
export class LettaRunner {
  private sdk: SDK | null = null;
  private session: Session | null = null;
  private status: RuntimeStatus = { ready: false, reason: 'not initialized', ...resolveCli() };
  private pending = new Map<string, (r: PermissionResponse) => void>();
  private aborted = false;

  constructor(
    private win: BrowserWindow,
    private config: ConfigStore,
  ) {}

  getStatus(): RuntimeStatus {
    return this.status;
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    const fn = this.pending.get(requestId);
    if (fn) {
      this.pending.delete(requestId);
      fn(response);
    }
  }

  private canUseTool() {
    return (toolName: string, toolInput: Record<string, unknown>): Promise<PermissionResponse> => {
      const requestId = randomUUID();
      const interactive = toolName === 'AskUserQuestion' || toolName === 'ExitPlanMode';
      const req: PermissionRequest = { requestId, toolName, toolInput, interactive };
      this.win.webContents.send('otto:permission', req);
      return new Promise<PermissionResponse>((resolve) => this.pending.set(requestId, resolve));
    };
  }

  private options(): CreateSessionOptions {
    const o: CreateSessionOptions = {
      permissionMode: 'default',
      includePartialMessages: false,
      canUseTool: this.canUseTool(),
    };
    const model = this.config.modelHandle();
    const effort = this.config.effort();
    if (model) o.model = modelSelectionForCli(model, effort);
    // Newer SDKs may expose this directly. Current CLI builds also apply effort when `model`
    // is a preset id (see modelSelectionForCli), so this is only a forward-compatible hint.
    if (effort !== 'off') (o as CreateSessionOptions & { reasoningEffort?: string }).reasoningEffort = effort;
    if (WANT_MEMFS) {
      o.memfs = true;
      o.memfsStartup = 'background';
    }
    return o;
  }

  /** Inject stored Letta key + discovered/local base URL into the spawned CLI env. */
  private applyConnectionEnv(baseUrl: string | null) {
    const cli = resolveCli();
    // Prefer the installed Letta Desktop CLI, which is the live local-backend runtime Sebastian is using.
    if (cli.cliResolved && !process.env.LETTA_CLI_PATH) process.env.LETTA_CLI_PATH = cli.cliPath;
    const key = getSecret('LETTA_API_KEY');
    if (key && !process.env.LETTA_API_KEY) process.env.LETTA_API_KEY = key;
    if (baseUrl) process.env.LETTA_BASE_URL = baseUrl;
  }

  private hasApiKey(): boolean {
    return hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY;
  }

  /** Connect; recover from stale agents/conversations; never throw to the renderer. */
  async init(): Promise<RuntimeStatus> {
    const cli = resolveCli();
    const context = discoverLocalLettaContext(this.config);
    this.applyConnectionEnv(context.baseUrl);
    const agentCandidates = context.agentCandidates;
    const primaryAgentId = agentCandidates[0] ?? null;

    let sdk: SDK;
    try {
      sdk = await this.loadSdk();
    } catch (e) {
      this.status = {
        ready: false,
        code: 'sdk-missing',
        reason: `Letta SDK unavailable: ${msg(e)}`,
        agentId: primaryAgentId,
        baseUrl: context.baseUrl,
        discoverySource: context.source,
        modelHandle: this.config.modelHandle(),
        effort: this.config.effort(),
        sessionMode: SMOKE_MODE ? 'smoke' : 'default',
        ...cli,
      };
      return this.status;
    }

    const tryOnce = async (resumeId: string | null) => {
      this.session?.close();
      const session = resumeId
        ? (SMOKE_MODE ? sdk.createSession(resumeId, this.options()) : sdk.resumeSession(resumeId, this.options()))
        : sdk.createSession(undefined, this.options());
      const init = await session.initialize();
      if (SMOKE_MODE && init.conversationId === 'default') {
        session.close();
        throw new Error('Smoke test refused to use conversation=default');
      }
      return { session, init };
    };

    try {
      let r: Awaited<ReturnType<typeof tryOnce>> | null = null;
      let lastAgentError: unknown = null;
      for (const candidate of agentCandidates) {
        try {
          // resumeSession's id is the AGENT id (maps to --agent); the conversation is the agent's
          // default. A stored conversationId is NOT a valid resume id — passing it would send
          // `--agent <conversationId>` and fail — so always resume with the agent id.
          r = await tryOnce(candidate);
          break;
        } catch (e) {
          lastAgentError = e;
          if (!isNotFound(e)) throw e;
        }
      }
      if (!r && !SMOKE_MODE && !process.env.OTTO_AGENT_ID) {
        r = await tryOnce(null);
      }
      if (!r) throw lastAgentError ?? new Error(context.reason ?? 'No local Letta agent candidate was available.');
      this.session = r.session;
      if (!SMOKE_MODE) this.config.update({ agentId: r.init.agentId ?? primaryAgentId, baseUrl: context.baseUrl, conversationId: r.init.conversationId ?? null });
      this.status = {
        ready: true,
        code: 'ready',
        agentId: r.init.agentId,
        baseUrl: context.baseUrl,
        discoverySource: context.source,
        conversationId: r.init.conversationId,
        model: r.init.model,
        modelHandle: this.config.modelHandle(),
        effort: this.config.effort(),
        sessionMode: SMOKE_MODE ? 'smoke' : 'default',
        memfsEnabled: r.init.memfsEnabled,
        tools: r.init.tools,
        ...cli,
      };
    } catch (e) {
      const reason = msg(e);
      const code = classify(reason, this.hasApiKey());
      this.status = {
        ready: false,
        code,
        reason: friendly(code, reason),
        agentId: primaryAgentId,
        baseUrl: context.baseUrl,
        discoverySource: context.source,
        modelHandle: this.config.modelHandle(),
        effort: this.config.effort(),
        sessionMode: SMOKE_MODE ? 'smoke' : 'default',
        ...cli,
      };
    }
    return this.status;
  }

  async configure(input: RuntimePreferences): Promise<RuntimeStatus> {
    this.config.update({
      ...(input.modelHandle !== undefined ? { modelHandle: input.modelHandle || null } : {}),
      ...(input.effort !== undefined ? { effort: input.effort } : {}),
    });
    this.session?.close();
    this.session = null;
    return this.init();
  }

  private publishStatus(): void {
    this.win.webContents.send('otto:event', { status: this.status });
  }

  private markNotReady(reason: string, code: StatusCode = 'error'): void {
    this.session = null;
    this.status = {
      ...this.status,
      ready: false,
      code,
      reason: friendly(code, reason),
      modelHandle: this.config.modelHandle(),
      effort: this.config.effort(),
      sessionMode: SMOKE_MODE ? 'smoke' : 'default',
    };
    if (code === 'stale' && !SMOKE_MODE) this.config.update({ conversationId: null });
    this.publishStatus();
  }

  async send(text: string): Promise<void> {
    if (!this.session || !this.status.ready) {
      this.emitError('Runtime not ready — open Settings and connect before sending.');
      return;
    }
    const trace = new TraceWriter(this.status.conversationId || 'new');
    this.aborted = false;
    trace.write('prompt', { text, agentId: this.status.agentId, conversationId: this.status.conversationId });
    try {
      let turnError: string | null = null;
      let sawResult = false;
      let markedNotReady = false;
      await this.session.send(text);
      for await (const message of this.session.stream()) {
        trace.write('event', message);
        this.win.webContents.send('otto:event', { message });
        const m = message as {
          type: string;
          conversationId?: string;
          message?: unknown;
          error?: unknown;
          reason?: unknown;
          success?: boolean;
        };
        if (m.type === 'error') {
          turnError = String(m.message ?? m.error ?? m.reason ?? 'Adapter call failed.');
          const code = classify(turnError, this.hasApiKey());
          if (code !== 'error') {
            this.markNotReady(turnError, code);
            markedNotReady = true;
          }
        }
        if (m.type === 'result') {
          sawResult = true;
          if (!SMOKE_MODE && !markedNotReady && m.conversationId && m.conversationId !== this.status.conversationId) {
            this.status.conversationId = m.conversationId;
            this.config.update({ conversationId: m.conversationId });
          }
          if (m.success === false) {
            const reason = turnError ?? String(m.error ?? m.reason ?? 'Adapter call failed.');
            if (!markedNotReady) this.markNotReady(reason, classify(reason, this.hasApiKey()));
          }
          break;
        }
        if (this.aborted) break;
      }
      if (turnError && !sawResult && !markedNotReady) {
        this.markNotReady(turnError, classify(turnError, this.hasApiKey()));
      }
    } catch (e) {
      trace.write('error', { message: msg(e) });
      if (isNotFound(e)) {
        this.markNotReady(msg(e), 'stale');
      }
      this.emitError(msg(e));
    } finally {
      trace.close();
    }
  }

  async abort(): Promise<void> {
    this.aborted = true;
    try {
      await this.session?.abort();
    } catch {
      // ignore
    }
  }

  private async loadSdk(): Promise<SDK> {
    if (!this.sdk) this.sdk = await import('@letta-ai/letta-code-sdk');
    return this.sdk;
  }

  private emitError(message: string) {
    this.win.webContents.send('otto:event', {
      message: { type: 'error', message, uuid: randomUUID() },
    });
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

type LocalLettaContext = {
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

function normalizeBaseUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  if (/^(localhost|127\.0\.0\.1):\d+$/i.test(trimmed)) return `http://${trimmed.replace(/\/+$/, '')}`;
  return null;
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

/**
 * Best-effort discovery of a running local Letta server's URL on macOS. A GUI-launched
 * otto can't know the dynamic port, so we ask the OS which loopback port a Letta process
 * is listening on. Returns null if none is found.
 */
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
    // lsof unavailable / blocked — fall through to settings/config only
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

/** Map a raw connect error to a diagnosis category for the Settings UI. */
function classify(reason: string, hasKey: boolean): StatusCode {
  const r = reason.toLowerCase();
  void hasKey;
  if (r.includes('letta_api_key') || r.includes('api key') || r.includes('unauthorized') || r.includes('401'))
    return 'no-api-key';
  if (r.includes('no agent') || r.includes('agent selector') || r.includes('agent-not-found') || r.includes('profile'))
    return 'no-agent';
  if (r.includes('not found') || r.includes('not-found')) return 'stale';
  if (
    r.includes('econnrefused') ||
    r.includes('enotfound') ||
    r.includes('fetch failed') ||
    r.includes('network') ||
    r.includes('socket') ||
    r.includes('timed out')
  )
    return 'unreachable';
  return 'error';
}

function friendly(code: StatusCode, reason: string): string {
  switch (code) {
    case 'no-api-key':
      return `Letta auth failed. For local v1, configure provider auth inside Letta; otto does not need its own API key. (${reason})`;
    case 'unreachable':
      return `Can't reach the Letta backend — check the base URL in Settings. (${reason})`;
    case 'no-agent':
      return `Can't find a default local Letta agent — open Letta once or choose an Agent ID override in Settings. (${reason})`;
    case 'stale':
      return `Saved Letta agent or conversation was stale — choose a valid Agent ID override in Settings or clear the override. (${reason})`;
    default:
      return reason;
  }
}

function modelSelectionForCli(modelHandle: string, effort: string): string {
  const e = effort === 'max' ? 'xhigh' : effort;
  const presets: Record<string, Partial<Record<string, string>>> = {
    'chatgpt-plus-pro/gpt-5.5': {
      off: 'gpt-5.5-plus-pro-none',
      low: 'gpt-5.5-plus-pro-low',
      medium: 'gpt-5.5-plus-pro-medium',
      high: 'gpt-5.5-plus-pro-high',
      xhigh: 'gpt-5.5-plus-pro-xhigh',
    },
    'anthropic/claude-opus-4-8': {
      low: 'opus-4.8-low',
      medium: 'opus-4.8-medium',
      high: 'opus-4.8-high',
      xhigh: 'opus-4.8-max',
    },
    'anthropic/claude-sonnet-4-6': {
      off: 'sonnet-4.6-no-reasoning',
      low: 'sonnet-4.6-low',
      medium: 'sonnet-4.6-medium',
      high: 'sonnet',
      xhigh: 'sonnet-4.6-xhigh',
    },
  };
  return presets[modelHandle]?.[e] ?? modelHandle;
}
