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

async function connectMockRuntime(transport: WsRuntimeTransport, conversationId: string) {
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

  test('smokeMode() reads OTTO_SMOKE at call time', () => {
    process.env.OTTO_SMOKE = '1';
    expect(smokeMode()).toBe(true);
    process.env.OTTO_SMOKE = '0';
    expect(smokeMode()).toBe(false);
  });
});
