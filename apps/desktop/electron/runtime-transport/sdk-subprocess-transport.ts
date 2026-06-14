import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode, OttoConfig } from '../shared/types';
import type { ConfigStore } from '../config-store';
import { ReceiptWriter } from '../receipt-writer';
import { getSecret, hasSecret } from '../secret-store';
import { StandardStore } from '../standard-store';
import { PracticeStore } from '../practice-store';
import { TraceWriter } from '../trace-writer';
import { discoverLocalLettaContext } from './letta-discovery';
import {
  SMOKE_MODE,
  WANT_MEMFS,
  classify,
  friendly,
  isInvalidModelError,
  isNotFound,
  modelInitAttempts,
  modelSelectionForCli,
  msg,
  nextActionFor,
  resolveCli,
  safeWebContentsSend,
  type ModelInitAttempt,
} from './runtime-common';
import { permissionSessionStore } from '../permission-session-store';
import type { OttoRuntimeTransport } from './types';

const DEFAULT_PERMISSION_TIMEOUT_MS = 120_000;

export function permissionTimeoutMs(): number {
  const raw = process.env.OTTO_PERMISSION_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PERMISSION_TIMEOUT_MS;
}

type PendingPermission = {
  toolName: string;
  resolve: (r: PermissionResponse) => void;
  timer: ReturnType<typeof setTimeout>;
};

type SDK = typeof import('@letta-ai/letta-code-sdk');
type Session = import('@letta-ai/letta-code-sdk').Session;
type CreateSessionOptions = import('@letta-ai/letta-code-sdk').CreateSessionOptions;

/** SDK/subprocess path — existing Letta Code session via @letta-ai/letta-code-sdk. */
export class SdkSubprocessTransport implements OttoRuntimeTransport {
  private sdk: SDK | null = null;
  private session: Session | null = null;
  private status: RuntimeStatus = { ready: false, reason: 'not initialized', ...resolveCli('embedded') };
  private pending = new Map<string, PendingPermission>();
  private receipts = new ReceiptWriter();
  private standards = new StandardStore();
  private practices = new PracticeStore();
  private aborted = false;

  constructor(
    private win: BrowserWindow,
    private config: ConfigStore,
  ) {}

  getStatus(): RuntimeStatus {
    return this.status;
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    const entry = this.pending.get(requestId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(requestId);
    if (response.behavior === 'allow' && response.scope === 'session') {
      permissionSessionStore.allow(entry.toolName);
    }
    entry.resolve(response);
  }

  private rejectPendingPermissions(message: string) {
    for (const [requestId, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.resolve({ behavior: 'deny', message });
      this.pending.delete(requestId);
    }
  }

  private canUseTool() {
    return (toolName: string, toolInput: Record<string, unknown>): Promise<PermissionResponse> => {
      if (permissionSessionStore.isAllowed(toolName)) {
        return Promise.resolve({ behavior: 'allow', scope: 'session' });
      }
      const requestId = randomUUID();
      const interactive = toolName === 'AskUserQuestion' || toolName === 'ExitPlanMode';
      const req: PermissionRequest = { requestId, toolName, toolInput, interactive };
      safeWebContentsSend(this.win, 'otto:permission', req);
      return new Promise<PermissionResponse>((resolve) => {
        const timer = setTimeout(() => {
          if (!this.pending.has(requestId)) return;
          this.pending.delete(requestId);
          resolve({ behavior: 'deny', message: 'Permission request timed out.' });
        }, permissionTimeoutMs());
        this.pending.set(requestId, { toolName, resolve, timer });
      });
    };
  }

  private options(modelAttempt?: ModelInitAttempt): CreateSessionOptions {
    const o: CreateSessionOptions = {
      permissionMode: 'default',
      includePartialMessages: false,
      canUseTool: this.canUseTool(),
    };
    const effort = modelAttempt?.effort ?? this.config.effort();
    if (modelAttempt?.cliModel) {
      o.model = modelAttempt.cliModel;
    } else {
      const model = this.config.modelHandle();
      if (model) o.model = modelSelectionForCli(model, effort);
    }
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
    const cli = resolveCli(this.config.connectionMode());
    if (cli.cliResolved && !process.env.LETTA_CLI_PATH) process.env.LETTA_CLI_PATH = cli.cliPath;
    if (this.config.connectionMode() === 'embedded' && !process.env.OTTO_LETTA_SETTINGS_PATH) {
      const lettaDir = this.config.ensureLettaStateDir();
      process.env.OTTO_LETTA_SETTINGS_PATH = join(lettaDir, 'settings.json');
    }
    const key = getSecret('LETTA_API_KEY');
    if (key && !process.env.LETTA_API_KEY) process.env.LETTA_API_KEY = key;
    if (baseUrl) process.env.LETTA_BASE_URL = baseUrl;
  }

  private hasApiKey(): boolean {
    return hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY;
  }

  /** Connect; recover from stale agents/conversations; never throw to the renderer. */
  async init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> {
    const cli = resolveCli(this.config.connectionMode());
    const context = discoverLocalLettaContext(this.config);
    this.applyConnectionEnv(context.baseUrl);
    const agentCandidates = context.agentCandidates;
    const primaryAgentId = agentCandidates[0] ?? null;

    if (!cli.cliResolved && this.config.connectionMode() === 'embedded') {
      this.status = {
        ready: false,
        code: 'error',
        reason: cli.cliFallbackReason ?? 'Embedded Letta engine not found in app bundle.',
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

    const fresh = !!opts?.freshConversation;
    const tryOnce = async (resumeId: string | null, modelAttempt?: ModelInitAttempt) => {
      this.session?.close();
      const sessionOpts = this.options(modelAttempt);
      const session = resumeId
        ? (fresh || SMOKE_MODE ? sdk.createSession(resumeId, sessionOpts) : sdk.resumeSession(resumeId, sessionOpts))
        : sdk.createSession(undefined, sessionOpts);
      const init = await session.initialize();
      if (SMOKE_MODE && init.conversationId === 'default') {
        session.close();
        throw new Error('Smoke test refused to use conversation=default');
      }
      return { session, init, modelAttempt };
    };

    const tryWithModelFallback = async (resumeId: string | null) => {
      const attempts = modelInitAttempts(this.config.modelHandle(), this.config.effort());
      if (attempts.length === 0) return tryOnce(resumeId);
      let lastModelError: unknown = null;
      for (const attempt of attempts) {
        try {
          return await tryOnce(resumeId, attempt);
        } catch (e) {
          if (isInvalidModelError(e)) {
            lastModelError = e;
            continue;
          }
          throw e;
        }
      }
      throw lastModelError ?? new Error('No supported model preset was found for this Letta build.');
    };

    try {
      let r: Awaited<ReturnType<typeof tryOnce>> | null = null;
      let lastAgentError: unknown = null;
      const candidates = fresh && primaryAgentId ? [primaryAgentId] : agentCandidates;
      for (const candidate of candidates) {
        try {
          // resumeSession's id is the AGENT id (maps to --agent); the conversation is the agent's
          // default. A stored conversationId is NOT a valid resume id — passing it would send
          // `--agent <conversationId>` and fail — so always resume with the agent id.
          r = await tryWithModelFallback(candidate);
          break;
        } catch (e) {
          lastAgentError = e;
          if (!isNotFound(e)) throw e;
        }
      }
      if (!r && !SMOKE_MODE && !process.env.OTTO_AGENT_ID) {
        r = await tryWithModelFallback(null);
      }
      if (!r) throw lastAgentError ?? new Error(context.reason ?? 'No local Letta agent candidate was available.');
      this.session = r.session;
      const usedAttempt = r.modelAttempt;
      if (usedAttempt && !SMOKE_MODE) {
        const patch: Partial<OttoConfig> = {};
        if (usedAttempt.effort !== this.config.effort()) patch.effort = usedAttempt.effort;
        if (usedAttempt.modelHandle && usedAttempt.modelHandle !== this.config.modelHandle()) {
          patch.modelHandle = usedAttempt.modelHandle;
        }
        if (Object.keys(patch).length) this.config.update(patch);
      }
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
        transportMode: 'sdk',
        effectiveTransport: 'sdk subprocess',
        transportFallbackReason: null,
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

  /** Start a fresh Letta conversation on the current agent; clears stored conversation id. */
  async newChat(): Promise<RuntimeStatus> {
    this.session?.close();
    this.session = null;
    if (!SMOKE_MODE) this.config.update({ conversationId: null });
    return this.init({ freshConversation: true });
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
    safeWebContentsSend(this.win, 'otto:event', { status: this.status });
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
      const reason = 'Runtime not ready — open Settings and connect before sending.';
      this.writeChatReceipt({
        text,
        status: 'blocked',
        summary: 'Chat turn blocked before send.',
        blocker: {
          code: this.status.code ?? 'runtime-not-ready',
          message: this.status.reason ?? reason,
          recoverable: true,
          next_action: 'Open Settings and connect Letta.',
        },
        evidence: [{ kind: 'status', ref: 'runtime.status', data: this.status }],
      });
      this.emitError(reason);
      return;
    }
    const trace = new TraceWriter(this.status.conversationId || 'new');
    const startedStatus = { ...this.status };
    this.aborted = false;
    trace.write('prompt', { text, agentId: this.status.agentId, conversationId: this.status.conversationId });
    try {
      let turnError: string | null = null;
      let sawResult = false;
      let markedNotReady = false;
      let receiptWritten = false;
      const writeReceipt = (status: 'success' | 'blocked' | 'failed', summary: string, blocker: Parameters<typeof this.writeChatReceipt>[0]['blocker']) => {
        if (receiptWritten) return;
        receiptWritten = true;
        this.writeChatReceipt({
          text,
          status,
          summary,
          blocker,
          startedStatus,
          resultData: {
            agentId: this.status.agentId,
            conversationId: this.status.conversationId,
            model: this.status.model,
            modelHandle: this.status.modelHandle,
            effort: this.status.effort,
            sessionMode: this.status.sessionMode,
          },
          evidence: [{ kind: 'log', ref: trace.path, note: 'Raw chat trace JSONL' }],
        });
      };
      await this.session.send(text);
      for await (const message of this.session.stream()) {
        trace.write('event', message);
        safeWebContentsSend(this.win, 'otto:event', { message });
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
            const code = classify(reason, this.hasApiKey());
            if (!markedNotReady) this.markNotReady(reason, code);
            writeReceipt(code === 'error' ? 'failed' : 'blocked', 'Chat turn did not complete.', {
              code,
              message: reason,
              recoverable: code !== 'error',
              next_action: nextActionFor(code),
            });
          } else {
            writeReceipt('success', 'Chat turn completed.', null);
          }
          break;
        }
        if (this.aborted) break;
      }
      if (turnError && !sawResult) {
        const code = classify(turnError, this.hasApiKey());
        if (!markedNotReady) this.markNotReady(turnError, code);
        writeReceipt(code === 'error' ? 'failed' : 'blocked', 'Chat turn ended without a result.', {
          code,
          message: turnError,
          recoverable: code !== 'error',
          next_action: nextActionFor(code),
        });
      }
      if (!sawResult) {
        if (!receiptWritten) {
          writeReceipt(this.aborted ? 'blocked' : 'failed', this.aborted ? 'Chat turn was aborted.' : 'Chat turn ended without a terminal result.', {
            code: this.aborted ? 'aborted' : 'missing-result',
            message: this.aborted ? 'The chat turn was aborted before completion.' : 'The runtime stream ended without a result or error event.',
            recoverable: true,
            next_action: 'Retry the message if the runtime is still connected.',
          });
        }
        this.emitTurnTerminal(false, this.aborted ? 'The chat turn was aborted before completion.' : turnError ?? 'The runtime stream ended without a result or error event.');
      }
    } catch (e) {
      const reason = msg(e);
      trace.write('error', { message: reason });
      if (isNotFound(e)) {
        // Mid-send recovery: mark not-ready + clear conversation so the next init recreates it.
        this.markNotReady(reason, 'stale');
      }
      const code = classify(reason, this.hasApiKey());
      this.writeChatReceipt({
        text,
        status: code === 'error' ? 'failed' : 'blocked',
        summary: 'Chat turn failed.',
        blocker: {
          code,
          message: reason,
          recoverable: code !== 'error',
          next_action: nextActionFor(code),
        },
        startedStatus,
        resultData: {
          agentId: this.status.agentId,
          conversationId: this.status.conversationId,
          model: this.status.model,
          modelHandle: this.status.modelHandle,
          effort: this.status.effort,
          sessionMode: this.status.sessionMode,
        },
        evidence: [{ kind: 'log', ref: trace.path, note: 'Raw chat trace JSONL' }],
      });
      this.emitError(reason);
    } finally {
      trace.close();
    }
  }

  async abort(): Promise<void> {
    this.aborted = true;
    this.rejectPendingPermissions('Chat turn was aborted.');
    try {
      await this.session?.abort();
    } catch {
      // ignore
    }
  }

  async close(): Promise<void> {
    this.session?.close();
    this.session = null;
    this.status = { ...this.status, ready: false, reason: 'transport closed' };
  }

  private async loadSdk(): Promise<SDK> {
    if (!this.sdk) this.sdk = await import('@letta-ai/letta-code-sdk');
    return this.sdk;
  }

  private emitError(message: string) {
    safeWebContentsSend(this.win, 'otto:event', {
      message: { type: 'error', message, uuid: randomUUID() },
    });
  }

  /** Emit a terminal result when the SDK stream ends without one (timeout/abort/missing result). */
  private emitTurnTerminal(success: boolean, reason?: string) {
    safeWebContentsSend(this.win, 'otto:event', {
      message: {
        type: 'result',
        success,
        conversationId: this.status.conversationId,
        error: reason,
        reason,
        uuid: randomUUID(),
      },
    });
  }

  private writeChatReceipt(input: {
    text: string;
    status: 'success' | 'blocked' | 'failed';
    summary: string;
    blocker: {
      code: string;
      message: string;
      recoverable: boolean;
      next_action?: string;
    } | null;
    startedStatus?: RuntimeStatus;
    resultData?: Record<string, unknown>;
    evidence: Array<{ kind: 'log' | 'status'; ref: string; note?: string; data?: unknown }>;
  }): void {
    const runtime = input.startedStatus ?? this.status;
    this.receipts.write({
      status: input.status,
      subject: { type: 'chat', id: runtime.conversationId ?? null },
      action: 'chat.send',
      input: {
        text: input.text,
        agentId: runtime.agentId ?? null,
        conversationId: runtime.conversationId ?? null,
        model: runtime.model ?? null,
        modelHandle: runtime.modelHandle ?? null,
        effort: runtime.effort ?? null,
        sessionMode: runtime.sessionMode ?? (SMOKE_MODE ? 'smoke' : 'default'),
      },
      result: {
        summary: input.summary,
        data: input.resultData,
      },
      evidence: input.evidence,
      standards: this.standardCitationsFor(input.text),
      practice: this.practiceFor(input.text),
      blocker: input.blocker,
    });
  }

  private standardCitationsFor(text: string) {
    try {
      return this.standards.citationsForText(text);
    } catch {
      return [];
    }
  }

  private practiceFor(text: string) {
    try {
      return this.practices.resolveForText(text);
    } catch {
      return null;
    }
  }
}
