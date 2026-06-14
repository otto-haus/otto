import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server as HttpServer } from 'node:http';
import type { BrowserWindow } from 'electron';
import { WebSocket, WebSocketServer } from 'ws';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode } from '../shared/types';
import type { ConfigStore } from '../config-store';
import { ReceiptWriter } from '../receipt-writer';
import { getSecret, hasSecret } from '../secret-store';
import { StandardStore } from '../standard-store';
import { PracticeStore } from '../practice-store';
import { TraceWriter } from '../trace-writer';
import { confirmedModelHandle, discoverLocalLettaContext, resolveHttpBaseUrl } from './letta-discovery';
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
import {
  DEFAULT_CONNECT_TIMEOUT_MS,
  isDeviceOnline,
  isLoopIdle,
  normalizeWsEvent,
  turnIdleTimeoutMs,
  type WsRuntimeEvent,
} from './ws-protocol';
import { permissionSessionStore } from '../permission-session-store';
import type { OttoRuntimeTransport } from './types';

const CONNECT_TIMEOUT_MS = DEFAULT_CONNECT_TIMEOUT_MS;
const REMOTE_SHUTDOWN_TIMEOUT_MS = 3_000;
const REMOTE_ENV = process.env.OTTO_WS_REMOTE_ENV ?? 'otto-byor';
const DEFAULT_WS_MODEL_FALLBACKS = ['openai/gpt-5.5', 'letta/auto'];

type PendingControl = {
  requestId: string;
  upstreamId: string;
  toolName: string;
  resolve: (r: PermissionResponse) => void;
};

/** Local BYOR WebSocket server; current Letta Code `server` connects inbound after local registration. */
export class WsRuntimeTransport implements OttoRuntimeTransport {
  private status: RuntimeStatus = { ready: false, reason: 'not initialized', ...resolveCli('embedded') };
  private server: WebSocketServer | null = null;
  private listenerPort: number | null = null;
  private registrationServer: HttpServer | null = null;
  private registrationPort: number | null = null;
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
  private remoteOutputChunks: string[] = [];
  private remoteGeneration = 0;
  private socketGeneration = 0;
  private initSerial: Promise<RuntimeStatus> = Promise.resolve(this.status);

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
    const upstreamId = pending.upstreamId;
    this.pendingControls.delete(requestId);
    if (response.behavior === 'allow' && response.scope === 'session') {
      permissionSessionStore.allow(pending.toolName);
    }
    pending.resolve(response);
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

  async init(opts?: { freshConversation?: boolean; strictModelHandle?: string | null }): Promise<RuntimeStatus> {
    const run = this.initSerial
      .catch(() => this.status)
      .then(() => this.initImpl(opts));
    this.initSerial = run;
    return run;
  }

  private async initImpl(opts?: { freshConversation?: boolean; strictModelHandle?: string | null }): Promise<RuntimeStatus> {
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
      await this.startRegistrationServer();
      await this.spawnRemote(cli.cliPath, context.baseUrl);
      await this.waitForRuntimeSocket();
      const savedConversationId = this.config.get().conversationId?.trim() || null;
      const conversationId = await this.resolveConversationForSync(
        agentId,
        context.baseUrl,
        savedConversationId,
        !!opts?.freshConversation,
      );
      if (!opts?.freshConversation && !smokeMode() && savedConversationId === 'default') {
        this.config.update({ conversationId: null });
      }
      const modelHandle = opts?.strictModelHandle !== undefined
        ? opts.strictModelHandle
        : await confirmedModelHandle(this.config).catch(() => this.config.modelHandle());
      if (modelHandle && modelHandle !== this.config.modelHandle() && !smokeMode()) {
        this.config.update({ modelHandle });
      }
      let activeModelHandle = modelHandle;
      try {
        activeModelHandle = await this.syncRuntimeWithFallback(agentId, conversationId ?? null, modelHandle, {
          allowFallback: opts?.strictModelHandle === undefined,
        });
      } catch (e) {
        if (!conversationId || !this.isStaleConversationError(e)) throw e;
        if (!smokeMode()) this.config.update({ conversationId: null });
        const replacementConversationId = await this.createBackendConversation(agentId, context.baseUrl);
        activeModelHandle = await this.syncRuntimeWithFallback(agentId, replacementConversationId, modelHandle, {
          allowFallback: opts?.strictModelHandle === undefined,
        });
      }
      if (activeModelHandle && activeModelHandle !== this.config.modelHandle() && !smokeMode()) {
        this.config.update({ modelHandle: activeModelHandle });
      }
      if (smokeMode() && this.status.conversationId === 'default') {
        await this.close();
        throw new Error('Smoke test refused to use conversation=default');
      }
      this.status = {
        ready: true,
        code: 'ready',
        reason: undefined,
        agentId,
        baseUrl: context.baseUrl,
        discoverySource: context.source,
        conversationId: this.status.conversationId ?? conversationId,
        modelHandle: activeModelHandle,
        effort: this.config.effort(),
        sessionMode: smokeMode() ? 'smoke' : 'default',
        transportMode: 'ws',
        effectiveTransport: 'websocket local',
        transportFallbackReason: null,
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
      this.emitStatus();
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
    const strictModelHandle = input.modelHandle !== undefined ? input.modelHandle || null : undefined;
    this.config.update({
      ...(input.modelHandle !== undefined ? { modelHandle: input.modelHandle || null } : {}),
      ...(input.effort !== undefined ? { effort: input.effort } : {}),
    });
    if (this.status.ready && this.runtimeSocket?.readyState === WebSocket.OPEN && this.status.agentId) {
      const conversationId = this.status.conversationId ?? this.config.get().conversationId ?? null;
      try {
        const activeModelHandle = await this.syncRuntimeWithFallback(
          this.status.agentId,
          conversationId,
          this.config.modelHandle(),
          { allowFallback: strictModelHandle === undefined },
        );
        this.status = {
          ...this.status,
          ready: true,
          code: 'ready',
          reason: undefined,
          conversationId: this.status.conversationId ?? conversationId,
          modelHandle: activeModelHandle,
          effort: this.config.effort(),
          transportMode: 'ws',
          effectiveTransport: 'websocket local',
          transportFallbackReason: null,
        };
        if (!smokeMode()) {
          this.config.update({
            conversationId: this.status.conversationId ?? null,
            modelHandle: activeModelHandle,
          });
        }
        this.emitStatus();
        return this.status;
      } catch {
        // Fall through to a full reconnect if the existing socket cannot resync.
      }
    }
    return this.init({ strictModelHandle });
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
    trace.write('prompt', { text, transport: 'ws', agentId: this.status.agentId, conversationId: this.status.conversationId });
    let detachRuntimeHandler = () => {};

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
      const emitResult = (success: boolean) => {
        safeWebContentsSend(this.win, 'otto:event', {
          message: { type: 'result', success, conversationId: this.status.conversationId, uuid: randomUUID() },
        });
      };

      const onRuntimeEvent = (event: WsRuntimeEvent) => {
        trace.write('event', event);
        if (event.type === 'control_request') {
          this.handleControlRequest(event);
          return;
        }
        this.trackActiveRun(event);
        const normalized = normalizeWsEvent(event);
        if (normalized) {
          safeWebContentsSend(this.win, 'otto:event', { message: normalized });
          if (normalized.type === 'assistant') sawAssistant = true;
          if (normalized.type === 'error') turnError = String(normalized.message ?? 'error');
        }
        if (isLoopIdle(event)) {
          this.turnIdle = true;
          emitResult(!turnError);
          writeReceipt(turnError ? 'failed' : 'success', turnError ? 'Chat turn failed.' : 'Chat turn completed.', turnError ? {
            code: 'error',
            message: turnError,
            recoverable: true,
            next_action: nextActionFor('error'),
          } : null);
        }
      };

      detachRuntimeHandler = this.attachRuntimeHandler(onRuntimeEvent);

      this.sendCommand({
        type: 'input',
        runtime: {
          agent_id: this.status.agentId,
          conversation_id: this.status.conversationId,
          model: this.status.modelHandle ?? undefined,
          reasoning_effort: this.status.effort,
        },
        payload: {
          kind: 'create_message',
          messages: [{ role: 'user', content: promptWithRuntimeContext(text, this.status), client_message_id: randomUUID() }],
          supports_control_response: true,
        },
      });

      const turnTimeoutMs = turnIdleTimeoutMs(text, CONNECT_TIMEOUT_MS);
      try {
        await this.waitForTurnComplete(turnTimeoutMs, () => this.aborted || this.turnIdle);
      } catch (e) {
        const idleTimeout = msg(e).includes('Timed out waiting for runtime idle');
        if (idleTimeout && turnError) {
          emitResult(false);
          writeReceipt('failed', 'Chat turn failed before idle confirmation.', {
            code: 'error',
            message: turnError,
            recoverable: true,
            next_action: nextActionFor('error'),
          });
          this.emitError(turnError);
        } else if (idleTimeout && sawAssistant && !this.activeRunId) {
          emitResult(true);
          writeReceipt('success', 'Chat turn completed without idle confirmation.', null);
        } else if (idleTimeout) {
          writeReceipt('failed', 'Chat turn timed out before the runtime became idle.', {
            code: 'idle_timeout',
            message: 'The runtime did not confirm idle in time. You can wait, send a follow-up, or reconnect.',
            recoverable: true,
            next_action: nextActionFor('error'),
          });
          this.emitError('Timed out waiting for the runtime to finish. Try again or reconnect if the turn looks stuck.');
        } else {
          throw e;
        }
      }
      if (!receiptWritten) {
        writeReceipt(this.aborted ? 'blocked' : sawAssistant ? 'success' : 'failed', this.aborted ? 'Chat turn was aborted.' : sawAssistant ? 'Chat turn completed.' : 'Chat turn ended without idle signal.', this.aborted ? {
          code: 'aborted',
          message: 'The chat turn was aborted before completion.',
          recoverable: true,
        } : null);
      }
    } catch (e) {
      trace.write('error', { message: msg(e) });
      const errorMessage = msg(e);
      const idleTimeout = errorMessage.includes('Timed out waiting for runtime idle');
      if (!idleTimeout) this.markNotReady(errorMessage);
      if (!idleTimeout) {
        this.writeChatReceipt({
          text,
          status: 'failed',
          summary: 'Chat turn failed.',
          blocker: { code: 'error', message: errorMessage, recoverable: true, next_action: nextActionFor('error') },
          startedStatus,
          tracePath: trace.path,
        });
        this.emitError(errorMessage);
      }
    } finally {
      detachRuntimeHandler();
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
    this.socketGeneration += 1;
    this.runtimeSocket?.removeAllListeners();
    if (this.runtimeSocket) {
      const socket = this.runtimeSocket as WebSocket & { terminate?: () => void };
      if (typeof socket.terminate === 'function') socket.terminate();
      else socket.close();
    }
    this.runtimeSocket = null;
    this.server?.clients.forEach((client) => {
      client.removeAllListeners();
      client.terminate();
    });
    this.remoteGeneration += 1;
    const remoteProc = this.remoteProc;
    if (this.remoteProc === remoteProc) {
      this.remoteProc = null;
    }
    await this.terminateRemoteProc(remoteProc);
    await new Promise<void>((resolve) => {
      if (!this.server) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, 1000);
      timer.unref?.();
      this.server.close(finish);
    });
    await new Promise<void>((resolve) => {
      if (!this.registrationServer) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, 1000);
      timer.unref?.();
      this.registrationServer.close(finish);
    });
    this.server = null;
    this.listenerPort = null;
    this.registrationServer = null;
    this.registrationPort = null;
    this.pendingControls.clear();
    this.controlByUpstream.clear();
    this.status = {
      ...this.status,
      ready: false,
      code: 'error',
      reason: 'transport closed',
    };
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

  private mintConversationId(): string {
    return `local-conv-${randomUUID()}`;
  }

  private async resolveConversationForSync(
    agentId: string,
    baseUrl: string | null,
    savedConversationId: string | null,
    freshConversation: boolean,
  ): Promise<string> {
    if (process.env.OTTO_WS_SKIP_CONVERSATION_CREATE === '1') {
      return freshConversation || savedConversationId === 'default' || !savedConversationId
        ? this.mintConversationId()
        : savedConversationId;
    }
    if (freshConversation || savedConversationId === 'default' || !savedConversationId) {
      return this.createBackendConversation(agentId, baseUrl);
    }
    if (await this.backendConversationExists(savedConversationId, baseUrl)) {
      return savedConversationId;
    }
    if (!smokeMode()) this.config.update({ conversationId: null });
    return this.createBackendConversation(agentId, baseUrl);
  }

  private async createBackendConversation(agentId: string, configuredBaseUrl: string | null): Promise<string> {
    if (process.env.OTTO_WS_SKIP_CONVERSATION_CREATE === '1') return this.mintConversationId();
    const baseUrl = resolveHttpBaseUrl(configuredBaseUrl);
    if (!baseUrl) throw new Error('Could not create Letta conversation: local Letta base URL was not discovered.');
    const url = new URL('/v1/conversations/', baseUrl);
    url.searchParams.set('agent_id', agentId);
    const res = await fetch(url, {
      method: 'POST',
      headers: this.localLettaHeaders(baseUrl),
      body: '{}',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Could not create Letta conversation (${res.status}${body ? `: ${body.slice(0, 180)}` : ''})`);
    }
    const raw = await res.json() as { id?: unknown; conversation_id?: unknown; conversationId?: unknown };
    const conversationId = [raw.id, raw.conversation_id, raw.conversationId].find((id): id is string =>
      typeof id === 'string' && id.trim().length > 0,
    );
    if (!conversationId) throw new Error('Could not create Letta conversation: response did not include an id.');
    return conversationId;
  }

  private async backendConversationExists(conversationId: string, configuredBaseUrl: string | null): Promise<boolean> {
    const baseUrl = resolveHttpBaseUrl(configuredBaseUrl);
    if (!baseUrl) return false;
    try {
      const url = new URL(`/v1/conversations/${encodeURIComponent(conversationId)}`, baseUrl);
      const res = await fetch(url, { headers: this.localLettaHeaders(baseUrl) });
      return res.ok;
    } catch {
      return false;
    }
  }

  private localLettaHeaders(baseUrl: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const configuredToken = getSecret('LETTA_API_KEY') || process.env.LETTA_API_KEY;
    const token = configuredToken || (this.isLoopbackBaseUrl(baseUrl) ? 'local-desktop' : null);
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  private isLoopbackBaseUrl(baseUrl: string): boolean {
    try {
      const host = new URL(baseUrl).hostname;
      return host === '127.0.0.1' || host === 'localhost' || host === '::1';
    } catch {
      return false;
    }
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
      const socketGeneration = ++this.socketGeneration;
      this.runtimeSocket = socket;
      this.lastReconnectAt = new Date().toISOString();
      socket.on('close', () => {
        if (this.socketGeneration === socketGeneration && this.runtimeSocket === socket) {
          this.runtimeSocket = null;
          this.markNotReady('Letta runtime disconnected from Otto WebSocket listener.');
        }
      });
    });
  }

  private async startRegistrationServer(): Promise<void> {
    if (!this.listenerPort) throw new Error('WebSocket listener not started');
    const wsUrl = `ws://127.0.0.1:${this.listenerPort}`;
    const connectionId = `otto-local-${randomUUID()}`;

    this.registrationServer = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      req.resume();
      if (req.method !== 'POST' || url.pathname !== '/v1/environments/register') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }
      if (req.headers.authorization !== `Bearer ${this.sessionToken}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        connectionId,
        wsUrl,
        supportsSplitStatusChannels: false,
      }));
    });

    await new Promise<void>((resolve, reject) => {
      this.registrationServer!.once('listening', () => {
        const addr = this.registrationServer!.address();
        if (addr && typeof addr === 'object') {
          this.registrationPort = addr.port;
          resolve();
        } else reject(new Error('Could not bind loopback registration endpoint'));
      });
      this.registrationServer!.once('error', reject);
      this.registrationServer!.listen(0, '127.0.0.1');
    });
  }

  private async spawnRemote(cliPath: string, backendBaseUrl: string | null): Promise<void> {
    if (!this.registrationPort) throw new Error('Registration endpoint not started');
    const registrationUrl = `http://127.0.0.1:${this.registrationPort}`;
    const env = {
      ...process.env,
      LETTA_BASE_URL: registrationUrl,
      IGNORE_SELF_HOSTED_LISTENER_ERROR: '1',
      LETTA_API_KEY: this.sessionToken,
      LETTA_LOCAL_BACKEND_EXPERIMENTAL: '1',
      ...(backendBaseUrl ? { OTTO_LETTA_BACKEND_URL: backendBaseUrl } : {}),
    };
    const nodeBin = process.env.LETTA_NODE?.trim() || 'node';
    this.remoteOutputChunks = [];
    const generation = ++this.remoteGeneration;
    const remoteProc = spawn(nodeBin, [cliPath, 'server', '--env-name', REMOTE_ENV, '--debug'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.remoteProc = remoteProc;
    remoteProc.stdout?.on('data', (chunk: Buffer) => {
      const line = String(chunk).trim();
      if (line) this.captureRemoteOutput(line);
    });
    remoteProc.stderr?.on('data', (chunk: Buffer) => {
      const line = String(chunk).trim();
      if (line) this.captureRemoteOutput(line);
    });
    remoteProc.on('exit', (code) => {
      if (!this.shouldHonorRemoteExit(remoteProc, generation)) return;
      if (code !== 0 && !this.runtimeSocket) {
        const detail = this.remoteOutputSummary() || `exit ${code}`;
        this.markNotReady(`Letta Code remote exited before connect (${detail}).`, 'unreachable');
      }
    });
  }

  private shouldHonorRemoteExit(proc: ChildProcess, generation: number): boolean {
    return proc === this.remoteProc && generation === this.remoteGeneration;
  }

  private async terminateRemoteProc(proc: ChildProcess | null): Promise<void> {
    if (!proc) return;
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    let done = false;
    const waitForExit = new Promise<void>((resolve) => {
      const finish = () => {
        done = true;
        proc.off('exit', finish);
        proc.off('close', finish);
        proc.off('error', finish);
        resolve();
      };
      proc.once('exit', finish);
      proc.once('close', finish);
      proc.once('error', finish);
    });
    if (!proc.killed) proc.kill('SIGTERM');
    await Promise.race([
      waitForExit,
      new Promise<void>((resolve) => setTimeout(resolve, REMOTE_SHUTDOWN_TIMEOUT_MS)),
    ]);
    if (!done && proc.exitCode === null && proc.signalCode === null) {
      proc.kill('SIGKILL');
      await Promise.race([
        waitForExit,
        new Promise<void>((resolve) => setTimeout(resolve, 500)),
      ]);
    }
  }

  private captureRemoteOutput(line: string): void {
    this.remoteOutputChunks.push(this.sanitizeRemoteOutput(line));
    if (this.remoteOutputChunks.length > 30) this.remoteOutputChunks.shift();
  }

  private remoteOutputSummary(): string {
    return this.remoteOutputChunks.slice(-4).join(' | ');
  }

  private sanitizeRemoteOutput(line: string): string {
    return line
      .replace(/\btoken\s+([a-z0-9._-]{6,})\b/gi, 'token [redacted]')
      .replace(/\bBearer\s+([a-z0-9._-]{6,})\b/gi, 'Bearer [redacted]')
      .replace(/\b(sk-[a-z0-9_-]{10,})\b/gi, 'sk-[redacted]');
  }

  private waitForRuntimeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (this.runtimeSocket?.readyState === WebSocket.OPEN) return resolve();
        if (Date.now() - started > CONNECT_TIMEOUT_MS) {
          return reject(new Error('Timed out waiting for Letta Code server to connect to Otto local WebSocket registration endpoint.'));
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

  private modelInitAttempts(preferredModelHandle?: string | null, opts?: { allowFallback?: boolean }): (string | null)[] {
    if (opts?.allowFallback === false) return [preferredModelHandle?.trim() || null];
    const configuredFallbacks = (process.env.OTTO_WS_MODEL_FALLBACKS ?? '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const attempts: (string | null)[] = [];
    for (const model of [preferredModelHandle?.trim() || null, ...configuredFallbacks, ...DEFAULT_WS_MODEL_FALLBACKS]) {
      const key = model ?? '';
      if (seen.has(key)) continue;
      seen.add(key);
      attempts.push(model);
    }
    return attempts.length ? attempts : [null];
  }

  private async syncRuntimeWithFallback(
    agentId: string,
    conversationId: string | null,
    preferredModelHandle?: string | null,
    opts?: { allowFallback?: boolean },
  ): Promise<string | null> {
    let lastError: unknown = null;
    const attempts = this.modelInitAttempts(preferredModelHandle, opts);
    for (const [index, modelHandle] of attempts.entries()) {
      try {
        await this.syncRuntime(agentId, conversationId, modelHandle);
        return modelHandle;
      } catch (e) {
        lastError = e;
        if (this.isStaleConversationError(e) || !this.isRetryableSyncError(e) || index === attempts.length - 1) {
          throw e;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'Runtime sync failed'));
  }

  private isRetryableSyncError(e: unknown): boolean {
    const text = msg(e).toLowerCase();
    return text.includes('timed out waiting for runtime sync') || text.includes('model') || text.includes('provider');
  }

  private async syncRuntime(agentId: string, conversationId: string | null, modelHandle?: string | null): Promise<void> {
    const scopedConversationId = conversationId?.trim() || this.mintConversationId();
    this.status.conversationId = scopedConversationId;
    const socket = this.runtimeSocket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('Letta runtime disconnected before sync.');
    }
    return new Promise((resolve, reject) => {
      let online = false;
      let idle = false;
      let timeout: ReturnType<typeof setTimeout>;
      let settled = false;
      const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
        if (this.runtimeSocket !== socket) {
          finish(new Error('Letta runtime socket changed during sync.'));
          return;
        }
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
          finish(new Error(String(event.message ?? event.error ?? 'Runtime sync failed')));
          return;
        }
        if (isDeviceOnline(event)) online = true;
        if (isLoopIdle(event)) idle = true;
        if (online && idle) {
          finish();
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('message', handler);
      };
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
      };
      timeout = setTimeout(() => {
        const detail = this.remoteOutputSummary();
        const modelDetail = modelHandle ? ` for model ${modelHandle}` : '';
        const outputDetail = detail ? `; latest Letta Code output: ${detail}` : '';
        finish(new Error(`Timed out waiting for runtime sync${modelDetail}${outputDetail}`));
      }, CONNECT_TIMEOUT_MS);
      socket.on('message', handler);
      try {
        socket.send(JSON.stringify({
          type: 'sync',
          runtime: {
            agent_id: agentId,
            conversation_id: scopedConversationId,
            model: modelHandle ?? undefined,
            reasoning_effort: this.config.effort(),
          },
          recover_approvals: true,
        }));
      } catch (e) {
        finish(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  private isStaleConversationError(e: unknown): boolean {
    const text = msg(e).toLowerCase();
    return text.includes('conversation') && (text.includes('not found') || text.includes('not-found') || text.includes('404') || text.includes('500'));
  }

  private attachRuntimeHandler(onEvent: (event: WsRuntimeEvent) => void): () => void {
    if (!this.runtimeSocket) return () => {};
    const socket = this.runtimeSocket;
    const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        onEvent(JSON.parse(String(raw)) as WsRuntimeEvent);
      } catch {
        // ignore malformed frames
      }
    };
    socket.on('message', handler);
    return () => socket.off('message', handler);
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
      upstreamId,
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
    this.emitStatus();
  }

  private emitStatus() {
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
