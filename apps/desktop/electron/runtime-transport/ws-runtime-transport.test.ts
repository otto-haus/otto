import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import type { BrowserWindow } from 'electron';
import { WebSocket } from 'ws';
import { ConfigStore } from '../config-store';
import { smokeMode } from './runtime-common';
import { WsRuntimeTransport } from './ws-runtime-transport';

const originalEnv = {
  OTTO_SMOKE: process.env.OTTO_SMOKE,
  OTTO_AGENT_ID: process.env.OTTO_AGENT_ID,
  OTTO_SKIP_LETTA_LSOF: process.env.OTTO_SKIP_LETTA_LSOF,
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
    ensurePrimaryAgentId: () => {},
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

async function closeMockSocket(socket: WebSocket) {
  socket.close();
  await new Promise<void>((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) return resolve();
    socket.once('close', () => resolve());
    setTimeout(resolve, 50);
  });
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
  onCommand?: (cmd: Record<string, unknown>, socket: WebSocket) => void,
) {
  const { port, token } = await waitForListener(transport);
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });

  socket.on('message', (raw) => {
    let cmd: Record<string, unknown>;
    try {
      cmd = JSON.parse(String(raw)) as Record<string, unknown>;
    } catch {
      return;
    }
    if (cmd.type === 'sync') {
      socket.send(JSON.stringify(syncResponse(conversationId)));
      socket.send(JSON.stringify(deviceOnline()));
      socket.send(JSON.stringify(loopIdle()));
    }
    if (onCommand) {
      onCommand(cmd, socket);
      return;
    }
    if (cmd.type === 'input') {
      socket.send(JSON.stringify({
        type: 'stream_delta',
        delta: { message_type: 'assistant_message', content: [{ text: 'ok' }] },
      }));
      socket.send(JSON.stringify(loopIdle()));
    }
  });

  return socket;
}

describe('WsRuntimeTransport', () => {
  beforeEach(() => {
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_AGENT_ID = 'agent-ws-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';
  });

  test('init reaches ready; smoke session; reconnect marks not ready on socket close', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const socket = await connectMockRuntime(transport, 'conv-ws-disposable');
    await initPromise;

    expect(transport.getStatus().ready).toBe(true);
    expect(transport.getStatus().conversationId).toBe('conv-ws-disposable');
    expect(transport.getStatus().effectiveTransport).toBe('websocket local');
    expect(smokeMode()).toBe(true);
    expect(transport.getStatus().sessionMode).toBe('smoke');

    socket.close();
    await new Promise((r) => setTimeout(r, 30));
    expect(transport.getStatus().ready).toBe(false);
    expect(transport.getStatus().reason).toContain('disconnected');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === false)).toBe(true);
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
      resolve: () => {},
    });

    transport.resolvePermission('otto-req-1', { behavior: 'allow' });
    expect(outbound).toBeTruthy();
    const frame = JSON.parse(outbound!);
    expect(frame.type).toBe('control_response');
    expect(frame.approved).toBe(true);
    expect(sent.length).toBe(0);
  });

  test('send rejects when WebSocket transport disconnected', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { status: { ready: boolean } }).status = {
      ...transport.getStatus(),
      ready: true,
    };
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = null;

    await expect(transport.send('hello while disconnected')).rejects.toThrow(/not ready/i);
    expect(sent.some((e) => (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(false);
  });

  test('resolvePermission fails turn when runtime socket is closed', () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.CLOSED,
    } as WebSocket;
    (transport as unknown as { turnIdle: boolean }).turnIdle = false;
    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set('upstream-1', 'otto-req-1');
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set('otto-req-1', {
      requestId: 'otto-req-1',
      toolName: 'AskUserQuestion',
      resolve: () => {},
    });

    transport.resolvePermission('otto-req-1', { behavior: 'allow' });
    expect((transport as unknown as { turnIdle: boolean }).turnIdle).toBe(true);
    expect((transport as unknown as { turnInterruptReason: string | null }).turnInterruptReason).toContain('disconnected');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);
  });

  test('runtime disconnect clears pending controls and interrupts active turn', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};

    const initPromise = transport.init({ freshConversation: true });
    const socket = await connectMockRuntime(transport, 'conv-ws-perm-disconnect');
    await initPromise;

    (transport as unknown as { turnIdle: boolean }).turnIdle = false;
    (transport as unknown as { activeRunId: string | null }).activeRunId = 'run-pending';
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set('otto-req-1', {
      requestId: 'otto-req-1',
      toolName: 'AskUserQuestion',
      resolve: () => {},
    });
    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set('upstream-1', 'otto-req-1');

    await closeMockSocket(socket);
    await new Promise((r) => setTimeout(r, 30));

    expect((transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.size).toBe(0);
    expect((transport as unknown as { turnIdle: boolean }).turnIdle).toBe(true);
    expect((transport as unknown as { turnInterruptReason: string | null }).turnInterruptReason).toContain('tool approval');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);
    await transport.close();
  });

  test('smokeMode() reads OTTO_SMOKE at call time', () => {
    process.env.OTTO_SMOKE = '1';
    expect(smokeMode()).toBe(true);
    process.env.OTTO_SMOKE = '0';
    expect(smokeMode()).toBe(false);
  });

  test('attachRuntimeHandler detaches per-turn listener', () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig());
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const socket = {
      on(event: string, handler: (...args: unknown[]) => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(handler);
        listeners.set(event, set);
      },
      off(event: string, handler: (...args: unknown[]) => void) {
        listeners.get(event)?.delete(handler);
      },
      listenerCount(event: string) {
        return listeners.get(event)?.size ?? 0;
      },
    };
    (transport as unknown as { runtimeSocket: typeof socket | null }).runtimeSocket = socket;

    const detach = (transport as unknown as {
      attachRuntimeHandler: (onEvent: (event: unknown) => void) => (() => void) | null;
    }).attachRuntimeHandler(() => {});
    expect(socket.listenerCount('message')).toBe(1);

    detach?.();
    expect(socket.listenerCount('message')).toBe(0);
  });

  test('turn idle timeout keeps transport ready and emits recoverable error', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(win, mockConfig('conv-ws-idle'));
    (transport as unknown as {
      runtimeSocket: WebSocket | null;
      status: { ready: boolean };
      waitForTurnComplete: () => Promise<void>;
      attachRuntimeHandler: () => void;
      sendCommand: () => void;
      writeChatReceipt: () => void;
    }).runtimeSocket = { readyState: WebSocket.OPEN } as WebSocket;
    (transport as unknown as { status: { ready: boolean } }).status = {
      ...(transport.getStatus()),
      ready: true,
      conversationId: 'conv-ws-idle',
      agentId: 'agent-ws-test',
    };
    (transport as unknown as { waitForTurnComplete: () => Promise<void> }).waitForTurnComplete = async () => {
      throw new Error('Timed out waiting for runtime idle');
    };
    (transport as unknown as { attachRuntimeHandler: () => void }).attachRuntimeHandler = () => {};
    (transport as unknown as { sendCommand: () => void }).sendCommand = () => {};
    (transport as unknown as { writeChatReceipt: () => void }).writeChatReceipt = () => {};

    await transport.send('draft while prior turn times out');

    expect(transport.getStatus().ready).toBe(true);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === false)).toBe(false);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);
  });
});
