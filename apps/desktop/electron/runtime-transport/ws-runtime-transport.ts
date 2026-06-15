import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { BrowserWindow } from 'electron';
import { WebSocket, WebSocketServer } from 'ws';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode } from '../shared/types';
import type { ConfigStore } from '../config-store';
import { ReceiptWriter } from '../receipt-writer';
import { getSecret, hasSecret } from '../secret-store';
import { StandardStore } from '../standard-store';
import { PracticeStore } from '../practice-store';
import { TraceWriter } from '../trace-writer';
import { confirmedModelHandle, discoverLocalLettaContext } from './letta-discovery';
import {
  smokeMode,
  classify,
  friendly,
  msg,
  nextActionFor,
  promptWithRuntimeContext,
  resolveCli,
  safeWebContentsSend,
} from './runtime-common';
import { TodoStreamAccumulator } from './todo-parser';
import { isDeviceOnline, isLoopIdle, normalizeWsEvent, type WsRuntimeEvent } from './ws-protocol';
import { permissionSessionStore } from '../permission-session-store';
import type { OttoRuntimeTransport } from './types';

const CONNECT_TIMEOUT_MS = 45_000;
const REMOTE_ENV = process.env.OTTO_WS_REMOTE_ENV ?? 'otto-byor';

type PendingControl = {
  requestId: string;
  toolName: string;
  resolve: (r: PermissionResponse) => void;
};

/** Local BYOR WebSocket server; Letta Code `remote` connects inbound. */
export class WsRuntimeTransport implements OttoRuntimeTransport {
  private status: RuntimeStatus = { ready: false, reason: 'not initialized', ...resolveCli('embedded') };
  private server: WebSocketServer | null = null;
  private listenerPort: number | null = null;
  private sessionToken = '';
  private runtimeSocket: WebSocket | null = null;
  private remoteProc: ChildProcess | null = null;
  private pendingControls = new Map<string, PendingControl>();
  private controlByUpstream = new Map<string, string>();
  private aborted = false;
  private turnIdle = false;
  private activeRunId: string | null = null;
  private receipts = new ReceiptWriter();
  private standards = new StandardStore();
  private practices = new PracticeStore();
  private lastReconnectAt: string | null = null;

  constructor(
    private win: BrowserWindow,
    private config: ConfigStore,
  ) {}

  getStatus(): RuntimeStatus {
    return this.status;
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    const pending = this.pendingControls.get(requestId);
    if (!pending) return;
    this.pendingControls.delete(requestId);
    if (response.behavior === 'allow' && response.scope === 'session') {
      permissionSessionStore.allow(pending.toolName);
    }
    pending.resolve(response);
    const upstreamId = [...this.controlByUpstream.entries()].find(([, id]) => id === requestId)?.[0];
    if (upstreamId && this.runtimeSocket?.readyState === WebSocket.OPEN) {
      const approved = response.behavior === 'allow';
      this.sendCommand({
        type: 'control_response',
        request_id: upstreamId,
        approved,
        message: approved ? undefined : response.message,
        updated_input: approved ? response.updatedInput ?? undefined : undefined,
      });
    }
  }

  async init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> {
    await this.close();
    const cli = resolveCli(this.config.connectionMode());
    const context = discoverLocalLettaContext(this.config);
    const agentId = context.agentCandidates[0] ?? context.agentId;
    if (!agentId) {
      return this.fail(context, 'no-agent', context.reason ?? 'No local Letta agent candidate was available.', cli);
    }
    if (!cli.cliResolved) {
      return this.fail(context, 'error', 'Letta CLI not found — install Letta Desktop or set LETTA_CLI_PATH for WS transport.', cli);
    }

    try {
      await this.startListener();
      await this.spawnRemote(cli.cliPath, context.baseUrl);
      await this.waitForRuntimeSocket();
      const conversationId = opts?.freshConversation ? null : this.config.get().conversationId;
      const resolved = await confirmedModelHandle(this.config).catch(() => ({
        requested: this.config.modelHandle(),
        active: this.config.modelHandle(),
        fallbackReason: null,
      }));
      try {
        await this.syncRuntime(agentId, conversationId ?? null, resolved.active);
      } catch (e) {
        if (!conversationId || !this.isStaleConversationError(e)) throw e;
        if (!smokeMode()) this.config.update({ conversationId: null });
        await this.syncRuntime(agentId, null, resolved.active);
      }
      if (smokeMode() && this.status.conversationId === 'default') {
        await this.close();
        throw new Error('Smoke test refused to use conversation=default');
      }
      this.status = {
        ready: true,
        code: 'ready',
        agentId,
        baseUrl: context.baseUrl,
        discoverySource: context.source,
        conversationId: this.status.conversationId ?? conversationId,
        modelHandle: resolved.requested,
        model: resolved.active ?? undefined,
        effort: this.config.effort(),
        sessionMode: smokeMode() ? 'smoke' : 'default',
        transportMode: 'ws',
        effectiveTransport: 'websocket local',
        transportFallbackReason: resolved.fallbackReason,
        wsListenerPort: this.listenerPort,
        lastReconnectAt: this.lastReconnectAt,
        ...cli,
      };
      if (!smokeMode()) {
        this.config.update({
          agentId,
          baseUrl: context.baseUrl,
          conversationId: this.status.conversationId ?? null,
        });
      }
    } catch (e) {
      await this.close();
      const reason = msg(e);
      const code = classify(reason, this.hasApiKey());
      return this.fail(context, code, friendly(code, reason), cli, agentId);
    }
    return this.status;
  }

  async newChat(): Promise<RuntimeStatus> {
    if (!smokeMode()) this.config.update({ conversationId: null });
    return this.init({ freshConversation: true });
  }

  async configure(input: RuntimePreferences): Promise<RuntimeStatus> {
    this.config.update({
      ...(input.modelHandle !== undefined ? { modelHandle: input.modelHandle || null } : {}),
      ...(input.effort !== undefined ? { effort: input.effort } : {}),
    });
    return this.init();
  }

  async send(text: string): Promise<void> {
    if (!this.status.ready || !this.runtimeSocket || this.runtimeSocket.readyState !== WebSocket.OPEN) {
      const reason = 'Runtime not ready — WebSocket transport disconnected.';
      this.emitError(reason);
      return;
    }
    const trace = new TraceWriter(this.status.conversationId || 'ws');
    const startedStatus = { ...this.status };
    this.aborted = false;
    this.turnIdle = false;
    this.activeRunId = null;
    const todoAccumulator = new TodoStreamAccumulator();
    trace.write('prompt', { text, transport: 'ws', agentId: this.status.agentId, conversationId: this.status.conversationId });

    try {
      let sawAssistant = false;
      let turnError: string | null = null;
      let receiptWritten = false;
      const writeReceipt = (
        status: 'success' | 'blocked' | 'failed',
        summary: string,
        blocker: { code: string; message: string; recoverable: boolean; next_action?: string } | null,
      ) => {
        if (receiptWritten) return;
        receiptWritten = true;
        this.writeChatReceipt({ text, status, summary, blocker, startedStatus, tracePath: trace.path });
      };

      const onRuntimeEvent = (event: WsRuntimeEvent) => {
        trace.write('event', event);
        if (event.type === 'control_request') {
          this.handleControlRequest(event);
          return;
        }
        this.trackActiveRun(event);
        const normalized = normalizeWsEvent(event, { todoAccumulator });
        if (normalized) {
          safeWebContentsSend(this.win, 'otto:event', { message: normalized });
          if (normalized.type === 'assistant') sawAssistant = true;
          if (normalized.type === 'todo_update') sawAssistant = true;
          if (normalized.type === 'error') turnError = String(normalized.message ?? 'error');
        }
        if (isLoopIdle(event)) {
          this.turnIdle = true;
          safeWebContentsSend(this.win, 'otto:event', {
            message: { type: 'result', success: !turnError, conversationId: this.status.conversationId, uuid: randomUUID() },
          });
          writeReceipt(turnError ? 'failed' : 'success', turnError ? 'Chat turn failed.' : 'Chat turn completed.', turnError ? {
            code: 'error',
            message: turnError,
            recoverable: true,
            next_action: nextActionFor('error'),
          } : null);
        }
      };

      this.attachRuntimeHandler(onRuntimeEvent);

      this.sendCommand({
        type: 'input',
        runtime: {
          agent_id: this.status.agentId,
          conversation_id: this.status.conversationId,
          model: this.status.model ?? this.status.modelHandle ?? undefined,
          reasoning_effort: this.status.effort,
        },
        payload: {
          kind: 'create_message',
          messages: [{ role: 'user', content: promptWithRuntimeContext(text, startedStatus), client_message_id: randomUUID() }],
          supports_control_response: true,
        },
      });

      await this.waitForTurnComplete(CONNECT_TIMEOUT_MS, () => this.aborted || this.turnIdle);
      if (!receiptWritten) {
        writeReceipt(this.aborted ? 'blocked' : sawAssistant ? 'success' : 'failed', this.aborted ? 'Chat turn was aborted.' : sawAssistant ? 'Chat turn completed.' : 'Chat turn ended without idle signal.', this.aborted ? {
          code: 'aborted',
          message: 'The chat turn was aborted before completion.',
          recoverable: true,
        } : null);
      }
    } catch (e) {
      trace.write('error', { message: msg(e) });
      this.markNotReady(msg(e));
      this.writeChatReceipt({
        text,
        status: 'failed',
        summary: 'Chat turn failed.',
        blocker: { code: 'error', message: msg(e), recoverable: true, next_action: nextActionFor('error') },
        startedStatus,
        tracePath: trace.path,
      });
      this.emitError(msg(e));
    } finally {
      trace.close();
    }
  }

  async abort(): Promise<void> {
    this.aborted = true;
    if (this.activeRunId && this.runtimeSocket?.readyState === WebSocket.OPEN) {
      this.sendCommand({ type: 'abort_message', run_id: this.activeRunId });
    }
    if (this.status.ready) {
      this.status = { ...this.status, code: 'ready', reason: 'Turn abort requested' };
    }
  }

  async close(): Promise<void> {
    this.runtimeSocket?.removeAllListeners();
    this.runtimeSocket?.close();
    this.runtimeSocket = null;
    if (this.remoteProc && !this.remoteProc.killed) {
      this.remoteProc.kill('SIGTERM');
    }
    this.remoteProc = null;
    await new Promise<void>((resolve) => {
      if (!this.server) return resolve();
      this.server.close(() => resolve());
    });
    this.server = null;
    this.listenerPort = null;
    this.pendingControls.clear();
    this.controlByUpstream.clear();
    this.status = { ...this.status, ready: false, reason: 'transport closed' };
  }

  private fail(
    context: ReturnType<typeof discoverLocalLettaContext>,
    code: StatusCode,
    reason: string,
    cli: ReturnType<typeof resolveCli>,
    agentId?: string | null,
  ): RuntimeStatus {
    this.status = {
      ready: false,
      code,
      reason,
      agentId: agentId ?? context.agentId,
      baseUrl: context.baseUrl,
      discoverySource: context.source,
      modelHandle: this.config.modelHandle(),
      effort: this.config.effort(),
      sessionMode: smokeMode() ? 'smoke' : 'default',
      transportMode: 'ws',
      effectiveTransport: 'websocket local',
      transportFallbackReason: reason,
      wsListenerPort: this.listenerPort,
      lastReconnectAt: this.lastReconnectAt,
      ...cli,
    };
    return this.status;
  }

  private hasApiKey(): boolean {
    return hasSecret('LETTA_API_KEY') || !!process.env.LETTA_API_KEY;
  }

  private async startListener(): Promise<void> {
    this.sessionToken = randomBytes(24).toString('hex');
    this.server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('listening', () => {
        const addr = this.server!.address();
        if (addr && typeof addr === 'object') {
          this.listenerPort = addr.port;
          resolve();
        } else reject(new Error('Could not bind loopback WebSocket listener'));
      });
      this.server!.once('error', reject);
    });

    this.server.on('connection', (socket, request: IncomingMessage) => {
      const auth = request.headers.authorization;
      if (auth !== `Bearer ${this.sessionToken}`) {
        socket.close(1008, 'unauthorized');
        return;
      }
      if (this.runtimeSocket && this.runtimeSocket.readyState === WebSocket.OPEN) {
        socket.close(1008, 'duplicate runtime connection');
        return;
      }
      this.runtimeSocket = socket;
      this.lastReconnectAt = new Date().toISOString();
      socket.on('close', () => {
        if (this.runtimeSocket === socket) {
          this.runtimeSocket = null;
          this.markNotReady('Letta runtime disconnected from Otto WebSocket listener.');
        }
      });
    });
  }

  private async spawnRemote(cliPath: string, backendBaseUrl: string | null): Promise<void> {
    if (!this.listenerPort) throw new Error('WebSocket listener not started');
    const key = getSecret('LETTA_API_KEY');
    const listenerUrl = `http://127.0.0.1:${this.listenerPort}`;
    const env = {
      ...process.env,
      LETTA_BASE_URL: listenerUrl,
      IGNORE_SELF_HOSTED_LISTENER_ERROR: '1',
      BYOR_REMOTE_TOKEN: this.sessionToken,
      ...(backendBaseUrl ? { OTTO_LETTA_BACKEND_URL: backendBaseUrl } : {}),
      ...(key ? { LETTA_API_KEY: key } : {}),
    };
    const nodeBin = process.env.LETTA_NODE?.trim() || 'node';
    const stderrChunks: string[] = [];
    this.remoteProc = spawn(nodeBin, [cliPath, 'remote', '--env-name', REMOTE_ENV, '--backend', 'local'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.remoteProc.stderr?.on('data', (chunk: Buffer) => {
      const line = String(chunk).trim();
      if (line) stderrChunks.push(line);
    });
    this.remoteProc.on('exit', (code) => {
      if (code !== 0 && !this.runtimeSocket) {
        const detail = stderrChunks.slice(-3).join(' | ') || `exit ${code}`;
        this.markNotReady(`Letta Code remote exited before connect (${detail}).`, 'unreachable');
      }
    });
  }

  private waitForRuntimeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (this.runtimeSocket?.readyState === WebSocket.OPEN) return resolve();
        if (Date.now() - started > CONNECT_TIMEOUT_MS) {
          return reject(new Error('Timed out waiting for Letta Code remote to connect (letta remote --backend local).'));
        }
        setTimeout(tick, 200);
      };
      tick();
    });
  }

  private sendCommand(command: Record<string, unknown>) {
    if (!this.runtimeSocket || this.runtimeSocket.readyState !== WebSocket.OPEN) {
      throw new Error('Letta runtime is not connected');
    }
    this.runtimeSocket.send(JSON.stringify(command));
  }

  private async syncRuntime(agentId: string, conversationId: string | null, modelHandle?: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      let online = false;
      let idle = false;
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for runtime sync')), CONNECT_TIMEOUT_MS);
      const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
        let event: WsRuntimeEvent;
        try {
          event = JSON.parse(String(raw)) as WsRuntimeEvent;
        } catch {
          return;
        }
        if (event.type === 'sync_response' || event.type === 'conversation_created') {
          const conv = (event.conversation_id ?? event.conversationId) as string | undefined;
          if (conv) this.status.conversationId = conv;
        }
        if (event.type === 'error') {
          clearTimeout(timeout);
          this.runtimeSocket?.off('message', handler);
          reject(new Error(String(event.message ?? event.error ?? 'Runtime sync failed')));
        }
        if (isDeviceOnline(event)) online = true;
        if (isLoopIdle(event)) idle = true;
        if (online && idle) {
          clearTimeout(timeout);
          this.runtimeSocket?.off('message', handler);
          resolve();
        }
      };
      this.runtimeSocket!.on('message', handler);
      this.sendCommand({
        type: 'sync',
        runtime: {
          agent_id: agentId,
          conversation_id: conversationId ?? undefined,
          model: modelHandle ?? undefined,
          reasoning_effort: this.config.effort(),
        },
        recover_approvals: true,
      });
    });
  }

  private isStaleConversationError(e: unknown): boolean {
    const text = msg(e).toLowerCase();
    return text.includes('conversation') && (text.includes('not found') || text.includes('not-found') || text.includes('404') || text.includes('500'));
  }

  private attachRuntimeHandler(onEvent: (event: WsRuntimeEvent) => void) {
    if (!this.runtimeSocket) return;
    const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        onEvent(JSON.parse(String(raw)) as WsRuntimeEvent);
      } catch {
        // ignore malformed frames
      }
    };
    this.runtimeSocket.on('message', handler);
  }

  private waitForTurnComplete(timeoutMs: number, aborted: () => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (aborted()) return resolve();
        if (Date.now() - started > timeoutMs) return reject(new Error('Timed out waiting for runtime idle'));
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  private trackActiveRun(event: WsRuntimeEvent) {
    if (event.type !== 'update_loop_status') return;
    const loop = event.loop_status as { active_run_ids?: unknown[] } | undefined;
    const ids = loop?.active_run_ids;
    if (Array.isArray(ids) && ids.length > 0) {
      this.activeRunId = String(ids[0]);
      return;
    }
    if (isLoopIdle(event)) this.activeRunId = null;
  }

  private handleControlRequest(event: WsRuntimeEvent) {
    const upstreamId = String(event.request_id ?? event.requestId ?? randomUUID());
    const toolName = String((event.tool_name ?? event.toolName ?? 'tool') as string);
    const toolInput = (event.tool_input ?? event.toolInput ?? {}) as Record<string, unknown>;
    if (permissionSessionStore.isAllowed(toolName)) {
      this.sendCommand({
        type: 'control_response',
        request_id: upstreamId,
        approved: true,
      });
      return;
    }
    const requestId = randomUUID();
    this.controlByUpstream.set(upstreamId, requestId);
    const interactive = toolName === 'AskUserQuestion' || toolName === 'ExitPlanMode';
    const req: PermissionRequest = { requestId, toolName, toolInput, interactive };
    safeWebContentsSend(this.win, 'otto:permission', req);
    this.pendingControls.set(requestId, {
      requestId,
      toolName,
      resolve: () => {
        this.controlByUpstream.delete(upstreamId);
      },
    });
  }

  private markNotReady(reason: string, code: StatusCode = 'error') {
    this.status = {
      ...this.status,
      ready: false,
      code,
      reason: friendly(code, reason),
    };
    safeWebContentsSend(this.win, 'otto:event', { status: this.status });
  }

  private emitError(message: string) {
    safeWebContentsSend(this.win, 'otto:event', {
      message: { type: 'error', message, uuid: randomUUID() },
    });
  }

  private writeChatReceipt(input: {
    text: string;
    status: 'success' | 'blocked' | 'failed';
    summary: string;
    blocker: { code: string; message: string; recoverable: boolean; next_action?: string } | null;
    startedStatus?: RuntimeStatus;
    tracePath: string;
  }) {
    const runtime = input.startedStatus ?? this.status;
    this.receipts.write({
      status: input.status,
      subject: { type: 'chat', id: runtime.conversationId ?? null },
      action: 'chat.send',
      input: {
        text: input.text,
        agentId: runtime.agentId ?? null,
        conversationId: runtime.conversationId ?? null,
        transport: 'ws',
      },
      result: { summary: input.summary },
      evidence: [{ kind: 'log', ref: input.tracePath, note: 'WS chat trace JSONL' }],
      standards: [],
      practice: null,
      blocker: input.blocker,
    });
  }
}
