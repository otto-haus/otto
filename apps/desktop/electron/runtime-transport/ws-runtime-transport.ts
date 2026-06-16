import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { BrowserWindow } from 'electron';
import { WebSocket, WebSocketServer } from 'ws';
import type { PermissionRequest, PermissionResponse, RuntimePreferences, RuntimeStatus, StatusCode } from '../shared/types';
import type { ConfigStore } from '../config-store';
import { ReceiptWriter } from '../receipt-writer';
import { hasLettaApiKey, resolveLettaApiKey } from '../letta-api-key';
import { StandardStore } from '../standard-store';
import { PracticeStore } from '../practice-store';
import { TraceWriter } from '../trace-writer';
import { applyEmbeddedLettaSettingsEnv } from '../dream-settings';
import { confirmedModelHandle, discoverLocalLettaContext, resolveLiveLocalLettaContext } from './letta-discovery';
import {
  smokeMode,
  classify,
  friendly,
  msg,
  nextActionFor,
  normalizeRuntimeError,
  promptWithRuntimeContext,
  promptContentWithRuntimeContext,
  resolveCli,
  safeWebContentsSend,
} from './runtime-common';
import { TodoStreamAccumulator } from './todo-parser';
import { TurnTrailAccumulator, trailTraceSummary } from '../../src/chat/turn-trail';
import {
  DEFAULT_CONNECT_TIMEOUT_MS,
  isDeviceOnline,
  isLoopIdle,
  normalizeWsEvent,
  turnIdleTimeoutMs,
  type WsRuntimeEvent,
} from './ws-protocol';
import { permissionSessionStore } from '../permission-session-store';
import { permissionLogStore } from '../permission-log-store';
import { prepareRuntimeSend } from '../attachment-delivery';
import type { RuntimeSendPayload } from '../../src/attachment-message';
import type { OttoRuntimeTransport, WsTransportDiagnosticsSnapshot } from './types';

const CONNECT_TIMEOUT_MS = DEFAULT_CONNECT_TIMEOUT_MS;
const REMOTE_ENV = process.env.OTTO_WS_REMOTE_ENV ?? 'otto-byor';

type PendingControl = {
  requestId: string;
  toolName: string;
  resolve: (r: PermissionResponse) => void;
  timeout?: ReturnType<typeof setTimeout>;
};

const DEFAULT_WS_PERMISSION_TIMEOUT_MS = 120_000;

/** WS permission auto-deny window — mirrors the SDK transport's OTTO_PERMISSION_TIMEOUT_MS (#691). */
function wsPermissionTimeoutMs(): number {
  const raw = process.env.OTTO_PERMISSION_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WS_PERMISSION_TIMEOUT_MS;
}

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
  private turnInterruptReason: string | null = null;
  private activeRunId: string | null = null;
  private turnMessageHandlerDetach: (() => void) | null = null;
  /** Status frames Letta may emit on connect before syncRuntime attaches its handler (#694). */
  private preSyncStatusFrames: WsRuntimeEvent[] = [];
  private preSyncMessageHandler: ((raw: Buffer | ArrayBuffer | Buffer[]) => void) | null = null;
  private receipts = new ReceiptWriter();
  private standards = new StandardStore();
  private practices = new PracticeStore();
  private lastReconnectAt: string | null = null;

  constructor(
    private getMainWindow: () => BrowserWindow | null,
    private config: ConfigStore,
  ) {}

  getStatus(): RuntimeStatus {
    return this.status;
  }

  getDiagnosticsSnapshot(): WsTransportDiagnosticsSnapshot {
    return {
      pendingPermissionCount: this.pendingControls.size,
      wsConnected: this.runtimeSocket ? this.runtimeSocket.readyState === WebSocket.OPEN : null,
      wsReadyState: this.runtimeSocket?.readyState ?? null,
      listenerPort: this.listenerPort,
      activeRunId: this.activeRunId,
      turnIdle: this.turnIdle,
      lastReconnectAt: this.lastReconnectAt,
      aborted: this.aborted,
    };
  }

  resolvePermission(requestId: string, response: PermissionResponse) {
    const pending = this.pendingControls.get(requestId);
    if (!pending) return;
    if (pending.timeout) clearTimeout(pending.timeout);
    this.pendingControls.delete(requestId);
    if (response.behavior === 'allow' && response.scope === 'session') {
      permissionSessionStore.allow(pending.toolName);
    }
    permissionLogStore.recordDecision(
      requestId,
      pending.toolName,
      response.behavior === 'allow'
        ? response.scope === 'session'
          ? 'allow-session'
          : 'allow-once'
        : 'deny',
      response.behavior === 'deny' ? { message: response.message } : undefined,
    );
    // Capture the upstream id before resolving: pending.resolve() clears the
    // controlByUpstream mapping, so looking it up afterward would always miss and the
    // control_response (incl. the #691 timeout auto-deny) would never reach Letta.
    const upstreamId = [...this.controlByUpstream.entries()].find(([, id]) => id === requestId)?.[0];
    pending.resolve(response);
    if (!upstreamId) return;
    if (this.runtimeSocket?.readyState === WebSocket.OPEN) {
      const approved = response.behavior === 'allow';
      this.sendCommand({
        type: 'control_response',
        request_id: upstreamId,
        approved,
        message: approved ? undefined : response.message,
        updated_input: approved ? response.updatedInput ?? undefined : undefined,
      });
      return;
    }
    const reason = 'Tool approval could not reach Letta — runtime disconnected. Reconnect and try again.';
    this.emitError(reason);
    if (!this.turnIdle) {
      this.turnInterruptReason = reason;
      this.turnIdle = true;
    }
  }

  async init(opts?: { freshConversation?: boolean }): Promise<RuntimeStatus> {
    await this.close();
    applyEmbeddedLettaSettingsEnv(this.config);
    const cli = resolveCli(this.config.connectionMode());
    const context = await resolveLiveLocalLettaContext(this.config);
    const agentId = context.agentCandidates[0] ?? context.agentId;
    if (!agentId) {
      return this.fail(
        context,
        'no-agent',
        friendly('no-agent', context.reason ?? 'No local Letta agent candidate was available.'),
        cli,
      );
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
        modelFallbackReason: resolved.fallbackReason,
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
        this.config.ensurePrimaryAgentId(agentId);
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

  async send(input: RuntimeSendPayload | string): Promise<void> {
    const prepared = prepareRuntimeSend(input);
    const storedText = prepared.storedText;
    if (!this.status.ready || !this.runtimeSocket || this.runtimeSocket.readyState !== WebSocket.OPEN) {
      throw new Error('Runtime not ready — WebSocket transport disconnected.');
    }
    this.clearTurnMessageHandler();
    const trace = new TraceWriter(this.status.conversationId || 'ws');
    const startedStatus = { ...this.status };
    this.aborted = false;
    this.turnIdle = false;
    this.turnInterruptReason = null;
    this.activeRunId = null;
    const todoAccumulator = new TodoStreamAccumulator();
    const trailAccumulator = new TurnTrailAccumulator();
    const assistantStreamId = randomUUID();
    trace.write('prompt', {
      storedText,
      attachmentCount: prepared.attachmentCount,
      transport: 'ws',
      agentId: this.status.agentId,
      conversationId: this.status.conversationId,
    });

    let lastTrailFingerprint = '';
    let trailFinalized = false;
    const finalizeTurnTrailEmit = () => {
      if (trailFinalized) return;
      trailFinalized = true;
      const trail = trailAccumulator.finalize();
      trace.write('turn_trail', trailTraceSummary(trail));
      safeWebContentsSend(this.getMainWindow(), 'otto:event', {
        message: { type: 'turn_trail', trail, final: true, uuid: randomUUID() },
      });
    };
    const emitTurnTrail = () => {
      const trail = trailAccumulator.snapshot();
      const fingerprint = JSON.stringify(trail.spans.map((s) => [s.id, s.status, s.label]));
      if (fingerprint === lastTrailFingerprint) return;
      lastTrailFingerprint = fingerprint;
      safeWebContentsSend(this.getMainWindow(), 'otto:event', {
        message: { type: 'turn_trail', trail, uuid: randomUUID() },
      });
    };
    try {
      let sawAssistant = false;
      let turnErrorRaw: string | null = null;
      let turnErrorMessage: string | null = null;
      let receiptWritten = false;
      const writeReceipt = (
        status: 'success' | 'blocked' | 'failed',
        summary: string,
        blocker: { code: string; message: string; recoverable: boolean; next_action?: string } | null,
      ) => {
        if (receiptWritten) return;
        receiptWritten = true;
        this.writeChatReceipt({ text: storedText, status, summary, blocker, startedStatus, tracePath: trace.path });
      };
      const emitResult = (success: boolean) => {
        safeWebContentsSend(this.getMainWindow(), 'otto:event', {
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
        const normalized = normalizeWsEvent(event, { todoAccumulator, trailAccumulator, assistantStreamId });
        if (normalized) {
          emitTurnTrail();
          if (normalized.type === 'error') {
            const raw = String(normalized.message ?? 'error');
            const normalizedError = normalizeRuntimeError(raw, this.hasApiKey());
            turnErrorRaw = raw;
            turnErrorMessage = normalizedError.message;
            if (normalizedError.code === 'usage-limit') {
              this.markNotReady(raw, normalizedError.code);
            }
            safeWebContentsSend(this.getMainWindow(), 'otto:event', {
              message: {
                type: 'error',
                message: normalizedError.message,
                ...(normalizedError.details ? { details: normalizedError.details } : {}),
                uuid: randomUUID(),
              },
            });
          } else {
            safeWebContentsSend(this.getMainWindow(), 'otto:event', { message: normalized });
            if (normalized.type === 'assistant') sawAssistant = true;
            if (normalized.type === 'todo_update') sawAssistant = true;
          }
        }
        if (isLoopIdle(event)) {
          finalizeTurnTrailEmit();
          this.turnIdle = true;
          emitResult(!turnErrorMessage);
          writeReceipt(turnErrorMessage ? 'failed' : 'success', turnErrorMessage ? 'Chat turn failed.' : 'Chat turn completed.', turnErrorRaw ? (() => {
            const normalizedError = normalizeRuntimeError(turnErrorRaw, this.hasApiKey());
            return {
              code: normalizedError.code,
              message: normalizedError.message,
              recoverable: normalizedError.code === 'usage-limit' || normalizedError.code !== 'error',
              next_action: nextActionFor(normalizedError.code),
              ...(normalizedError.details ? { details: normalizedError.details } : {}),
            };
          })() : null);
          this.clearTurnMessageHandler();
        }
      };

      this.turnMessageHandlerDetach = this.attachRuntimeHandler(onRuntimeEvent);

      const messageContent = prepared.attachmentCount > 0 || prepared.deliveryContent.length > 1
        ? promptContentWithRuntimeContext(prepared.deliveryContent, startedStatus)
        : promptWithRuntimeContext(
          prepared.deliveryContent[0]?.type === 'text' ? prepared.deliveryContent[0].text : storedText,
          startedStatus,
        );

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
          messages: [{ role: 'user', content: messageContent, client_message_id: randomUUID() }],
          supports_control_response: true,
        },
      });

      const turnTimeoutMs = turnIdleTimeoutMs(storedText, CONNECT_TIMEOUT_MS, prepared.attachmentCount);
      try {
        await this.waitForTurnComplete(turnTimeoutMs, () => this.aborted || this.turnIdle);
      } catch (e) {
        const idleTimeout = msg(e).includes('Timed out waiting for runtime idle');
        if (idleTimeout && turnErrorMessage) {
          finalizeTurnTrailEmit();
          emitResult(false);
          writeReceipt('failed', 'Chat turn failed before idle confirmation.', turnErrorRaw ? (() => {
            const normalizedError = normalizeRuntimeError(turnErrorRaw, this.hasApiKey());
            return {
              code: normalizedError.code,
              message: normalizedError.message,
              recoverable: true,
              next_action: nextActionFor(normalizedError.code),
              ...(normalizedError.details ? { details: normalizedError.details } : {}),
            };
          })() : {
            code: 'error',
            message: turnErrorMessage,
            recoverable: true,
            next_action: nextActionFor('error'),
          });
          this.emitError(turnErrorMessage);
        } else if (idleTimeout && sawAssistant && !this.activeRunId) {
          finalizeTurnTrailEmit();
          emitResult(true);
          writeReceipt('success', 'Chat turn completed without idle confirmation.', null);
        } else if (idleTimeout) {
          finalizeTurnTrailEmit();
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
      if (this.turnInterruptReason && !receiptWritten) {
        finalizeTurnTrailEmit();
        emitResult(false);
        writeReceipt('failed', 'Chat turn failed.', {
          code: 'error',
          message: this.turnInterruptReason,
          recoverable: true,
          next_action: nextActionFor('error'),
        });
      } else if (!receiptWritten) {
        finalizeTurnTrailEmit();
        writeReceipt(this.aborted ? 'blocked' : sawAssistant ? 'success' : 'failed', this.aborted ? 'Chat turn was aborted.' : sawAssistant ? 'Chat turn completed.' : 'Chat turn ended without idle signal.', this.aborted ? {
          code: 'aborted',
          message: 'The chat turn was aborted before completion.',
          recoverable: true,
        } : null);
      }
    } catch (e) {
      const reason = msg(e);
      trace.write('error', { message: reason });
      const idleTimeout = reason.includes('Timed out waiting for runtime idle');
      if (!idleTimeout) {
        const normalizedError = normalizeRuntimeError(reason, this.hasApiKey());
        this.markNotReady(reason, normalizedError.code);
        finalizeTurnTrailEmit();
        this.writeChatReceipt({
          text: storedText,
          status: 'failed',
          summary: 'Chat turn failed.',
          blocker: {
            code: normalizedError.code,
            message: normalizedError.message,
            recoverable: normalizedError.code === 'usage-limit' || normalizedError.code !== 'error',
            next_action: nextActionFor(normalizedError.code),
          },
          startedStatus,
          tracePath: trace.path,
        });
        this.emitError(normalizedError.message, normalizedError.details);
      }
    } finally {
      if (this.turnIdle || this.aborted) {
        this.clearTurnMessageHandler();
      }
      trace.close();
    }
  }

  private rejectPendingPermissions(message: string) {
    for (const [, pending] of this.pendingControls) {
      if (pending.timeout) clearTimeout(pending.timeout);
      try {
        pending.resolve({ behavior: 'deny', message });
      } catch {
        // ignore resolver errors during abort
      }
    }
    if (this.runtimeSocket?.readyState === WebSocket.OPEN) {
      for (const [upstreamId] of this.controlByUpstream) {
        try {
          this.sendCommand({
            type: 'control_response',
            request_id: upstreamId,
            approved: false,
            message,
          });
        } catch {
          // ignore send failures during abort
        }
      }
    }
    this.pendingControls.clear();
    this.controlByUpstream.clear();
  }

  /** Clear any pending permission auto-deny timers before dropping the pending map (#691). */
  private clearPendingControlTimers() {
    for (const [, pending] of this.pendingControls) {
      if (pending.timeout) clearTimeout(pending.timeout);
    }
  }

  async abort(): Promise<void> {
    this.aborted = true;
    this.rejectPendingPermissions('Chat turn was aborted.');
    if (this.activeRunId && this.runtimeSocket?.readyState === WebSocket.OPEN) {
      try {
        this.sendCommand({ type: 'abort_message', run_id: this.activeRunId });
      } catch {
        // ignore abort_message failures during disconnect
      }
    }
    // Stop must end the turn promptly even when no run id has arrived yet (early stream /
    // slow tool start): unblock waitForTurnComplete instead of waiting the full idle timeout (#692).
    this.turnIdle = true;
    if (this.status.ready) {
      this.status = { ...this.status, code: 'ready', reason: 'Turn abort requested' };
    }
  }

  async close(): Promise<void> {
    this.clearTurnMessageHandler();
    this.detachPreSyncStatusBuffer();
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
    this.clearPendingControlTimers();
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
    return hasLettaApiKey(this.config);
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
      this.attachPreSyncStatusBuffer(socket);
      socket.on('close', () => {
        if (this.runtimeSocket === socket) {
          this.runtimeSocket = null;
          this.handleRuntimeDisconnect();
        }
      });
    });
  }

  private async spawnRemote(cliPath: string, backendBaseUrl: string | null): Promise<void> {
    if (!this.listenerPort) throw new Error('WebSocket listener not started');
    applyEmbeddedLettaSettingsEnv(this.config);
    const key = resolveLettaApiKey(this.config);
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

  private attachPreSyncStatusBuffer(socket: WebSocket) {
    this.detachPreSyncStatusBuffer();
    this.preSyncStatusFrames = [];
    const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const event = JSON.parse(String(raw)) as WsRuntimeEvent;
        if (event.type === 'update_device_status' || event.type === 'update_loop_status') {
          this.preSyncStatusFrames.push(event);
        }
      } catch {
        // ignore malformed frames
      }
    };
    this.preSyncMessageHandler = handler;
    socket.on('message', handler);
  }

  private detachPreSyncStatusBuffer() {
    if (this.preSyncMessageHandler && this.runtimeSocket) {
      this.runtimeSocket.off('message', this.preSyncMessageHandler);
    }
    this.preSyncMessageHandler = null;
    this.preSyncStatusFrames = [];
  }

  private takePreSyncStatusFrames(): WsRuntimeEvent[] {
    const frames = this.preSyncStatusFrames;
    this.preSyncStatusFrames = [];
    if (this.preSyncMessageHandler && this.runtimeSocket) {
      this.runtimeSocket.off('message', this.preSyncMessageHandler);
    }
    this.preSyncMessageHandler = null;
    return frames;
  }

  private async syncRuntime(agentId: string, conversationId: string | null, modelHandle?: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      let online = false;
      let idle = false;
      const timeout = setTimeout(() => {
        // Terminal outcome must remove the temp listener so no ghost handler fires on later turns (#690).
        this.runtimeSocket?.off('message', handler);
        reject(new Error('Timed out waiting for runtime sync'));
      }, CONNECT_TIMEOUT_MS);
      const processEvent = (event: WsRuntimeEvent) => {
        if (event.type === 'sync_response' || event.type === 'conversation_created') {
          const conv = (event.conversation_id ?? event.conversationId) as string | undefined;
          if (conv) this.status.conversationId = conv;
        }
        if (event.type === 'error') {
          clearTimeout(timeout);
          this.runtimeSocket?.off('message', handler);
          reject(new Error(String(event.message ?? event.error ?? 'Runtime sync failed')));
          return;
        }
        if (isDeviceOnline(event)) online = true;
        if (isLoopIdle(event)) idle = true;
        if (online && idle) {
          clearTimeout(timeout);
          this.runtimeSocket?.off('message', handler);
          resolve();
        }
      };
      const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
        try {
          processEvent(JSON.parse(String(raw)) as WsRuntimeEvent);
        } catch {
          // ignore malformed frames
        }
      };
      const buffered = this.takePreSyncStatusFrames();
      this.runtimeSocket!.on('message', handler);
      for (const event of buffered) processEvent(event);
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

  private clearTurnMessageHandler() {
    this.turnMessageHandlerDetach?.();
    this.turnMessageHandlerDetach = null;
  }

  private attachRuntimeHandler(onEvent: (event: WsRuntimeEvent) => void): (() => void) | null {
    if (!this.runtimeSocket) return null;
    const handler = (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        onEvent(JSON.parse(String(raw)) as WsRuntimeEvent);
      } catch {
        // ignore malformed frames
      }
    };
    this.runtimeSocket.on('message', handler);
    return () => {
      this.runtimeSocket?.off('message', handler);
    };
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
    permissionLogStore.recordPending(req);
    safeWebContentsSend(this.getMainWindow(), 'otto:permission', req);
    // Match SDK transport: auto-deny if the user never responds, so Letta does not wait
    // indefinitely for control_response when the modal is dismissed or the renderer stalls (#691).
    const timeout = setTimeout(() => {
      if (!this.pendingControls.has(requestId)) return;
      this.resolvePermission(requestId, {
        behavior: 'deny',
        message: 'Permission request timed out.',
      });
    }, wsPermissionTimeoutMs());
    this.pendingControls.set(requestId, {
      requestId,
      toolName,
      timeout,
      resolve: () => {
        this.controlByUpstream.delete(upstreamId);
      },
    });
  }

  private handleRuntimeDisconnect() {
    const hadPending = this.pendingControls.size > 0;
    this.clearPendingControlTimers();
    this.pendingControls.clear();
    this.controlByUpstream.clear();
    const activeTurn = !this.turnIdle && (hadPending || this.activeRunId !== null);
    if (activeTurn) {
      this.turnInterruptReason = hadPending
        ? 'Letta runtime disconnected while waiting for tool approval. Reconnect and try again.'
        : 'Letta runtime disconnected during an active turn. Reconnect and try again.';
      this.turnIdle = true;
      this.emitError(this.turnInterruptReason);
    }
    this.markNotReady('Letta runtime disconnected from Otto WebSocket listener.');
  }

  private markNotReady(reason: string, code: StatusCode = 'error') {
    this.status = {
      ...this.status,
      ready: false,
      code,
      reason: friendly(code, reason),
    };
    safeWebContentsSend(this.getMainWindow(), 'otto:event', { status: this.status });
  }

  private emitError(message: string, details?: string) {
    safeWebContentsSend(this.getMainWindow(), 'otto:event', {
      message: { type: 'error', message, ...(details ? { details } : {}), uuid: randomUUID() },
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
