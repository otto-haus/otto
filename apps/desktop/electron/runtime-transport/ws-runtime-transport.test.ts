import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import type { ChildProcess } from 'node:child_process';
import type { BrowserWindow } from 'electron';
import { WebSocket } from 'ws';
import { ConfigStore } from '../config-store';
import { smokeMode } from './runtime-common';
import { WsRuntimeTransport } from './ws-runtime-transport';

const originalEnv = {
  OTTO_SMOKE: process.env.OTTO_SMOKE,
  OTTO_AGENT_ID: process.env.OTTO_AGENT_ID,
  OTTO_SKIP_LETTA_LSOF: process.env.OTTO_SKIP_LETTA_LSOF,
  OTTO_WS_SKIP_CONVERSATION_CREATE: process.env.OTTO_WS_SKIP_CONVERSATION_CREATE,
  LETTA_CLI_PATH: process.env.LETTA_CLI_PATH,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

function mockWindow() {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  const win = {
    isDestroyed: () => false,
    webContents: {
      isDestroyed: () => false,
      send(channel: string, payload: unknown) {
        sent.push({ channel, payload });
      },
    },
  } as unknown as BrowserWindow;
  return { win, sent };
}

function mockConfig(conversationId: string | null = null): ConfigStore {
  return {
    connectionMode: () => 'existing' as const,
    primaryAgentId: () => 'agent-ws-test',
    modelHandle: () => null,
    effort: () => 'max' as const,
    baseUrl: () => 'http://127.0.0.1:8283',
    agentId: () => 'agent-ws-test',
    agentCandidates: () => ['agent-ws-test'],
    get: () => ({ conversationId }),
    update: () => ({}),
  } as unknown as ConfigStore;
}

function mockMutableConfig(conversationId: string | null = null): ConfigStore {
  let modelHandle: string | null = null;
  let effort: 'off' | 'low' | 'medium' | 'high' | 'max' = 'max';
  return {
    ...mockConfig(conversationId),
    modelHandle: () => modelHandle,
    effort: () => effort,
    update: (patch: { modelHandle?: string | null; effort?: typeof effort }) => {
      if ('modelHandle' in patch) modelHandle = patch.modelHandle ?? null;
      if (patch.effort) effort = patch.effort;
      return {};
    },
  } as unknown as ConfigStore;
}

function deviceOnline() {
  return { type: 'update_device_status', device_status: { is_online: true } };
}

function loopIdle() {
  return { type: 'update_loop_status', loop_status: { status: 'WAITING_ON_INPUT', active_run_ids: [] } };
}

function syncResponse(conversationId: string) {
  return { type: 'sync_response', conversation_id: conversationId };
}

async function waitForListener(transport: WsRuntimeTransport, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const port = (transport as unknown as { listenerPort: number | null }).listenerPort;
    const token = (transport as unknown as { sessionToken: string }).sessionToken;
    if (port && token) return { port, token };
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for WS listener');
}

async function connectMockRuntime(
  transport: WsRuntimeTransport,
  conversationId: string,
  onCommand?: (cmd: Record<string, unknown>) => void,
) {
  const { port, token } = await waitForListener(transport);
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  socket.on('message', (raw) => {
    let cmd: Record<string, unknown>;
    try {
      cmd = JSON.parse(String(raw)) as Record<string, unknown>;
    } catch {
      return;
    }
    onCommand?.(cmd);
    if (cmd.type === 'sync') {
      socket.send(JSON.stringify(syncResponse(conversationId)));
      socket.send(JSON.stringify(deviceOnline()));
      socket.send(JSON.stringify(loopIdle()));
    }
    if (cmd.type === 'input') {
      socket.send(JSON.stringify({
        type: 'stream_delta',
        delta: { message_type: 'assistant_message', content: [{ text: 'ok' }] },
      }));
      socket.send(JSON.stringify(loopIdle()));
    }
  });

  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });

  return socket;
}

describe('WsRuntimeTransport', () => {
  beforeEach(() => {
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_AGENT_ID = 'agent-ws-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_WS_SKIP_CONVERSATION_CREATE = '1';
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';
  });

  test('init reaches ready; smoke session; reconnect marks not ready on socket close', async () => {
    const { win, sent } = mockWindow();
    const commands: Array<Record<string, unknown>> = [];
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const socket = await connectMockRuntime(transport, 'conv-ws-disposable', (cmd) => commands.push(cmd));
    await initPromise;

    expect(transport.getStatus().ready).toBe(true);
    expect(transport.getStatus().conversationId).toBe('conv-ws-disposable');
    expect(transport.getStatus().effectiveTransport).toBe('websocket local');
    expect(smokeMode()).toBe(true);
    expect(transport.getStatus().sessionMode).toBe('smoke');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === true)).toBe(true);
    const syncCommand = commands.find((cmd) => cmd.type === 'sync');
    expect(syncCommand).toBeTruthy();
    const runtime = syncCommand?.runtime as { conversation_id?: string } | undefined;
    expect(runtime?.conversation_id).toMatch(/^local-conv-/);

    socket.close();
    await new Promise((r) => setTimeout(r, 30));
    expect(transport.getStatus().ready).toBe(false);
    expect(transport.getStatus().reason).toContain('disconnected');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === false)).toBe(true);
    await transport.close();
    expect(transport.getStatus().ready).toBe(false);
    expect(transport.getStatus().code).toBe('error');
    expect(transport.getStatus().reason).toBe('transport closed');
  });

  test('stale remote process exit cannot overwrite a newer WS session', () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    const oldProc = { killed: false } as ChildProcess;
    const newProc = { killed: false } as ChildProcess;

    (transport as unknown as { remoteGeneration: number }).remoteGeneration = 2;
    (transport as unknown as { remoteProc: ChildProcess | null }).remoteProc = newProc;

    expect((transport as unknown as {
      shouldHonorRemoteExit: (proc: ChildProcess, generation: number) => boolean;
    }).shouldHonorRemoteExit(oldProc, 1)).toBe(false);
    expect((transport as unknown as {
      shouldHonorRemoteExit: (proc: ChildProcess, generation: number) => boolean;
    }).shouldHonorRemoteExit(newProc, 2)).toBe(true);
  });

  test('stale runtime socket close cannot overwrite a newer WS session', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const socket = await connectMockRuntime(transport, 'conv-ws-disposable');
    await initPromise;

    expect(transport.getStatus().ready).toBe(true);
    (transport as unknown as { socketGeneration: number }).socketGeneration += 1;
    socket.close();
    await new Promise((r) => setTimeout(r, 30));

    expect(transport.getStatus().ready).toBe(true);
    await transport.close();
  });

  test('configure resyncs an existing websocket without full init', async () => {
    const { win } = mockWindow();
    const config = mockMutableConfig();
    const transport = new WsRuntimeTransport(win, config);
    let synced: { agentId: string; conversationId: string | null; modelHandle: string | null } | null = null;
    (transport as unknown as { status: Record<string, unknown> }).status = {
      ready: true,
      code: 'ready',
      agentId: 'agent-ws-test',
      conversationId: 'conv-ws-configure',
      modelHandle: null,
    };
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      removeAllListeners: () => {},
      close: () => {},
    } as unknown as WebSocket;
    (transport as unknown as {
      syncRuntimeWithFallback: (agentId: string, conversationId: string | null, modelHandle: string | null) => Promise<string | null>;
    }).syncRuntimeWithFallback = async (agentId, conversationId, modelHandle) => {
      synced = { agentId, conversationId, modelHandle };
      return modelHandle;
    };
    (transport as unknown as { init: () => Promise<unknown> }).init = async () => {
      throw new Error('full init should not run for ready socket configure');
    };

    const status = await transport.configure({ modelHandle: 'openai/gpt-5.5', effort: 'high' });

    expect(status.ready).toBe(true);
    expect(status.modelHandle).toBe('openai/gpt-5.5');
    expect(status.effort).toBe('high');
    expect(synced).toEqual({
      agentId: 'agent-ws-test',
      conversationId: 'conv-ws-configure',
      modelHandle: 'openai/gpt-5.5',
    });
    await transport.close();
  });

  test('explicit configure does not silently fall back to another model', async () => {
    const { win } = mockWindow();
    const config = mockMutableConfig();
    const transport = new WsRuntimeTransport(win, config);
    const attempted: Array<{ modelHandle: string | null | undefined; allowFallback?: boolean }> = [];
    (transport as unknown as { status: Record<string, unknown> }).status = {
      ready: true,
      code: 'ready',
      agentId: 'agent-ws-test',
      conversationId: 'conv-ws-configure',
      modelHandle: 'openai/gpt-5.5',
    };
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      removeAllListeners: () => {},
      close: () => {},
    } as unknown as WebSocket;
    (transport as unknown as {
      syncRuntimeWithFallback: (
        agentId: string,
        conversationId: string | null,
        modelHandle: string | null,
        opts?: { allowFallback?: boolean },
      ) => Promise<string | null>;
    }).syncRuntimeWithFallback = async (_agentId, _conversationId, modelHandle, opts) => {
      attempted.push({ modelHandle, allowFallback: opts?.allowFallback });
      throw new Error('selected model unavailable');
    };
    (transport as unknown as { init: (opts?: { strictModelHandle?: string | null }) => Promise<unknown> }).init = async (opts) => {
      attempted.push({ modelHandle: opts?.strictModelHandle, allowFallback: false });
      return {
        ready: true,
        code: 'ready',
        agentId: 'agent-ws-test',
        conversationId: 'conv-ws-configure',
        modelHandle: opts?.strictModelHandle,
      };
    };

    const status = await transport.configure({ modelHandle: 'anthropic/claude-opus-4-8' });

    expect(status.modelHandle).toBe('anthropic/claude-opus-4-8');
    expect(attempted).toEqual([
      { modelHandle: 'anthropic/claude-opus-4-8', allowFallback: false },
      { modelHandle: 'anthropic/claude-opus-4-8', allowFallback: false },
    ]);
    await transport.close();
  });

  test('abort sends abort_message for active run and completes turn', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    let abortPayload: string | null = null;
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        abortPayload = payload;
      },
    } as unknown as WebSocket;
    (transport as unknown as { activeRunId: string | null }).activeRunId = 'run-abort-1';
    (transport as unknown as { aborted: boolean }).aborted = false;

    await transport.abort();
    expect((transport as unknown as { aborted: boolean }).aborted).toBe(true);
    expect(abortPayload).toBeTruthy();
    expect(JSON.parse(abortPayload!).type).toBe('abort_message');
    expect(JSON.parse(abortPayload!).run_id).toBe('run-abort-1');
  });

  test('does not keep stale per-turn runtime handlers after send completes', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const socket = await connectMockRuntime(transport, 'conv-ws-disposable');
    await initPromise;

    await transport.send('first');
    await transport.send('second');

    const assistantEvents = sent.filter((event) => {
      const message = (event.payload as { message?: { type?: string } }).message;
      return event.channel === 'otto:event' && message?.type === 'assistant';
    });
    expect(assistantEvents.length).toBe(2);

    socket.close();
    await transport.close();
  });

  test('redacts token-like remote output before surfacing sync failures', () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    const debugTransport = transport as unknown as {
      captureRemoteOutput: (line: string) => void;
      remoteOutputSummary: () => string;
    };

    debugTransport.captureRemoteOutput('Scheduler lease held by PID 88202 (token 90fc5da4).');

    const summary = debugTransport.remoteOutputSummary();
    expect(summary).toContain('token [redacted]');
    expect(summary).not.toContain('90fc5da4');
  });

  test('resolvePermission emits control_response on runtime socket', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    let outbound: string | null = null;
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        outbound = payload;
      },
    } as unknown as WebSocket;

    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set('upstream-1', 'otto-req-1');
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set('otto-req-1', {
      requestId: 'otto-req-1',
      upstreamId: 'upstream-1',
      resolve: () => {},
    });

    transport.resolvePermission('otto-req-1', { behavior: 'allow' });
    expect(outbound).toBeTruthy();
    const frame = JSON.parse(outbound!);
    expect(frame.type).toBe('control_response');
    expect(frame.request_id).toBe('upstream-1');
    expect(frame.approved).toBe(true);
    expect(sent.length).toBe(0);
  });

  test('resolvePermission uses stored upstream id after pending cleanup', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    let outbound: string | null = null;
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        outbound = payload;
      },
    } as unknown as WebSocket;

    const upstreamId = 'upstream-race-1';
    const requestId = 'otto-req-race';
    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set(upstreamId, requestId);
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set(requestId, {
      requestId,
      upstreamId,
      toolName: 'run_shell',
      resolve: () => {
        (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.delete(upstreamId);
      },
    });

    transport.resolvePermission(requestId, { behavior: 'deny', message: 'nope' });
    expect(outbound).toBeTruthy();
    const frame = JSON.parse(outbound!);
    expect(frame.request_id).toBe(upstreamId);
    expect(frame.approved).toBe(false);
  });

  test('smokeMode() reads OTTO_SMOKE at call time', () => {
    process.env.OTTO_SMOKE = '1';
    expect(smokeMode()).toBe(true);
    process.env.OTTO_SMOKE = '0';
    expect(smokeMode()).toBe(false);
  });

  test('idle timeout without assistant keeps transport ready', async () => {
    const prevTimeout = process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS;
    process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS = '80';
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const { port, token } = await waitForListener(transport);
    const socket = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    socket.on('message', (raw) => {
      let cmd: Record<string, unknown>;
      try {
        cmd = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      if (cmd.type === 'sync') {
        socket.send(JSON.stringify(syncResponse('conv-ws-idle')));
        socket.send(JSON.stringify(deviceOnline()));
        socket.send(JSON.stringify(loopIdle()));
      }
      if (cmd.type === 'input') {
        // Deliberately omit assistant + idle to force idle timeout.
      }
    });
    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve());
      socket.once('error', reject);
    });
    await initPromise;

    await transport.send('wait forever');
    expect(transport.getStatus().ready).toBe(true);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);

    if (prevTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_WS_TURN_IDLE_TIMEOUT_MS');
    else process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS = prevTimeout;
    socket.close();
    await transport.close();
  });

  test('assistant response without idle emits terminal result and keeps transport ready', async () => {
    const prevTimeout = process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS;
    process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS = '80';
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const { port, token } = await waitForListener(transport);
    const socket = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    socket.on('message', (raw) => {
      let cmd: Record<string, unknown>;
      try {
        cmd = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      if (cmd.type === 'sync') {
        socket.send(JSON.stringify(syncResponse('conv-ws-assistant-no-idle')));
        socket.send(JSON.stringify(deviceOnline()));
        socket.send(JSON.stringify(loopIdle()));
      }
      if (cmd.type === 'input') {
        socket.send(JSON.stringify({
          type: 'stream_delta',
          delta: { message_type: 'assistant_message', content: [{ text: 'partial ok' }] },
        }));
      }
    });
    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve());
      socket.once('error', reject);
    });
    await initPromise;

    await transport.send('attachment-heavy turn');

    expect(transport.getStatus().ready).toBe(true);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'assistant')).toBe(true);
    expect(sent.some((e) => {
      const message = (e.payload as { message?: { type?: string; success?: boolean } }).message;
      return e.channel === 'otto:event' && message?.type === 'result' && message.success === true;
    })).toBe(true);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(false);

    if (prevTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_WS_TURN_IDLE_TIMEOUT_MS');
    else process.env.OTTO_WS_TURN_IDLE_TIMEOUT_MS = prevTimeout;
    socket.close();
    await transport.close();
  });
});
