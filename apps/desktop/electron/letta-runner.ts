import { randomUUID } from 'node:crypto';
import type { BrowserWindow } from 'electron';
import type { PermissionRequest, PermissionResponse, RuntimeStatus, StatusCode } from './shared/types';
import { ConfigStore } from './config-store';
import { getSecret, hasSecret } from './secret-store';
import { TraceWriter } from './trace-writer';

type SDK = typeof import('@letta-ai/letta-code-sdk');
type Session = import('@letta-ai/letta-code-sdk').Session;
type CreateSessionOptions = import('@letta-ai/letta-code-sdk').CreateSessionOptions;

// Git-backed memfs is server/cloud-only — the local backend rejects it. Default OFF.
// Set OTTO_MEMFS=1 to force it on for backends that support it.
const WANT_MEMFS = process.env.OTTO_MEMFS === '1' || process.env.OTTO_MEMFS === 'true';

function resolveCli(): { cliPath: string; cliResolved: boolean } {
  const p = process.env.LETTA_CLI_PATH;
  return p
    ? { cliPath: p, cliResolved: true }
    : { cliPath: '(bundled @letta-ai/letta-code)', cliResolved: false };
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
    if (WANT_MEMFS) {
      o.memfs = true;
      o.memfsStartup = 'background';
    }
    return o;
  }

  /** Inject the stored Letta key + base URL into the env the SDK hands the spawned CLI. */
  private applyConnectionEnv() {
    const key = getSecret('LETTA_API_KEY');
    if (key && !process.env.LETTA_API_KEY) process.env.LETTA_API_KEY = key;
    const baseUrl = this.config.baseUrl();
    if (baseUrl && !process.env.LETTA_BASE_URL) process.env.LETTA_BASE_URL = baseUrl;
  }

  private hasApiKey(): boolean {
    return hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY;
  }

  /** Connect; recover from a stale conversation; never throw to the renderer. */
  async init(): Promise<RuntimeStatus> {
    const cli = resolveCli();
    this.applyConnectionEnv();
    const agentId = this.config.agentId();
    if (!agentId) {
      this.status = {
        ready: false,
        code: 'no-agent',
        reason: 'No agent selected — add one in Settings → Connect Letta.',
        ...cli,
      };
      return this.status;
    }

    let sdk: SDK;
    try {
      sdk = await this.loadSdk();
    } catch (e) {
      this.status = { ready: false, code: 'sdk-missing', reason: `Letta SDK unavailable: ${msg(e)}`, agentId, ...cli };
      return this.status;
    }

    const cfg = this.config.get();
    const tryOnce = async (resumeId: string) => {
      const session = sdk.resumeSession(resumeId, this.options());
      const init = await session.initialize();
      return { session, init };
    };

    try {
      let r: { session: Session; init: Awaited<ReturnType<Session['initialize']>> };
      try {
        // Prefer a stored conversation; fall back to the agent's default conversation.
        r = await tryOnce(cfg.conversationId || agentId);
      } catch (e) {
        if (isNotFound(e) && cfg.conversationId) {
          this.config.update({ conversationId: null }); // clear the stale id
          r = await tryOnce(agentId); // recover on the agent's default conversation
        } else {
          throw e;
        }
      }
      this.session = r.session;
      this.config.update({ agentId: r.init.agentId ?? agentId, conversationId: r.init.conversationId ?? null });
      this.status = {
        ready: true,
        code: 'ready',
        agentId: r.init.agentId,
        conversationId: r.init.conversationId,
        model: r.init.model,
        memfsEnabled: r.init.memfsEnabled,
        tools: r.init.tools,
        ...cli,
      };
    } catch (e) {
      // agent-not-found / auth / provider / unreachable — diagnose cleanly, do not crash.
      const reason = msg(e);
      const code = classify(reason, this.hasApiKey());
      this.status = { ready: false, code, reason: friendly(code, reason), agentId, ...cli };
    }
    return this.status;
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
      await this.session.send(text);
      for await (const message of this.session.stream()) {
        trace.write('event', message);
        this.win.webContents.send('otto:event', { message });
        const m = message as { type: string; conversationId?: string };
        if (m.type === 'result') {
          if (m.conversationId && m.conversationId !== this.status.conversationId) {
            this.status.conversationId = m.conversationId;
            this.config.update({ conversationId: m.conversationId });
          }
          break;
        }
        if (this.aborted) break;
      }
    } catch (e) {
      trace.write('error', { message: msg(e) });
      if (isNotFound(e)) {
        // Mid-send recovery: mark not-ready + clear conversation so the next init recreates it.
        this.status = { ...this.status, ready: false, reason: msg(e) };
        this.config.update({ conversationId: null });
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

/** Map a raw connect error to a diagnosis category for the Settings UI. */
function classify(reason: string, hasKey: boolean): StatusCode {
  const r = reason.toLowerCase();
  if (!hasKey || r.includes('letta_api_key') || r.includes('api key') || r.includes('unauthorized') || r.includes('401'))
    return 'no-api-key';
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
      return 'No Letta API key. Add it in Settings → Connect Letta to authenticate.';
    case 'unreachable':
      return `Can't reach the Letta backend — check the base URL in Settings. (${reason})`;
    case 'stale':
      return `Agent or conversation not found — pick a valid agent in Settings. (${reason})`;
    default:
      return reason;
  }
}
