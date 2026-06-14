import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import type { BrowserWindow } from 'electron';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode } from './shared/types';
import { ConfigStore } from './config-store';
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
 * Single Otto session against OTTO_AGENT_ID. Recovers from a stale conversation id
 * (clear it, ride the agent's default conversation) instead of hard-failing.
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

  /** Inject the stored Letta key + base URL into the env the SDK hands the spawned CLI. */
  private applyConnectionEnv() {
    const cli = resolveCli();
    // The SDK can otherwise resolve a stale cached @letta-ai/letta-code package. Prefer the
    // installed Letta Desktop CLI, which is the live local-backend runtime Sebastian is using.
    if (cli.cliResolved && !process.env.LETTA_CLI_PATH) process.env.LETTA_CLI_PATH = cli.cliPath;
    const key = getSecret('LETTA_API_KEY');
    if (key && !process.env.LETTA_API_KEY) process.env.LETTA_API_KEY = key;
    // Base URL: explicit config/env wins; otherwise auto-discover a running local Letta
    // server so a normal user never has to find a port. (Letta Code local mode is Otto's
    // one hard dependency; the spawned CLI otherwise defaults to Letta Cloud and fails for
    // a local agent.)
    const baseUrl = normalizeBaseUrl(this.config.baseUrl() ?? discoverLocalLettaUrl());
    if (baseUrl && !process.env.LETTA_BASE_URL) process.env.LETTA_BASE_URL = baseUrl;
  }

  private hasApiKey(): boolean {
    return hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY;
  }

  /** Connect; recover from a stale conversation; never throw to the renderer. */
  async init(): Promise<RuntimeStatus> {
    const cli = resolveCli();
    this.applyConnectionEnv();
    const agentCandidates = this.config.agentCandidates();
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
      if (!r) throw lastAgentError ?? new Error('No local Letta agent candidate was available.');
      this.session = r.session;
      if (!SMOKE_MODE) this.config.update({ agentId: r.init.agentId ?? primaryAgentId, conversationId: r.init.conversationId ?? null });
      this.status = {
        ready: true,
        code: 'ready',
        agentId: r.init.agentId,
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
      // agent-not-found / auth / provider / unreachable — diagnose cleanly, do not crash.
      const reason = msg(e);
      const code = classify(reason, this.hasApiKey());
      this.status = {
        ready: false,
        code,
        reason: friendly(code, reason),
        agentId: primaryAgentId,
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
        // Mid-send recovery: mark not-ready + clear conversation so the next init recreates it.
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

/**
 * Best-effort discovery of a running local Letta server's URL on macOS. A GUI-launched
 * Otto can't know the (dynamic) port the user's Letta Code chose, so we ask the OS which
 * loopback port a Letta process is listening on. Returns null if none is found (then the
 * CLI falls back to its default / the user sets a base URL in Settings).
 */
function discoverLocalLettaUrl(): string | null {
  if (process.platform !== 'darwin') return null;
  try {
    const out = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], {
      timeout: 3000,
      encoding: 'utf8',
    });
    for (const line of out.split('\n')) {
      if (!/letta/i.test(line)) continue; // command column contains "Letta"
      const m = line.match(/127\.0\.0\.1:(\d+)/);
      if (m) return `http://127.0.0.1:${m[1]}`;
    }
  } catch {
    // lsof unavailable / blocked — fall through to null
  }
  return null;
}

function normalizeBaseUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `http://${trimmed.replace(/\/+$/, '')}`;
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
      return `Letta auth failed. For local v1, configure provider auth inside Letta; Otto does not need its own API key. (${reason})`;
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
