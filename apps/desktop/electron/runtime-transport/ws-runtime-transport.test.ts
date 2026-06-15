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

function loopIdle() {
  return { type: 'update_loop_status', loop_status: { status: 'WAITING_ON_INPUT', active_run_ids: [] } };
}

type FakeRuntimeSocket = {
  readyState: number;
  send: (payload: string) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  listenerCount: (event: string) => number;
  emitMessage: (raw: string) => void;
  close: () => void;
};

function createFakeRuntimeSocket(): FakeRuntimeSocket {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const socket: FakeRuntimeSocket = {
    readyState: WebSocket.OPEN,
    send() {},
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
    emitMessage(raw: string) {
      for (const handler of listeners.get('message') ?? []) {
        handler(Buffer.from(raw));
      }
    },
    close() {
      socket.readyState = WebSocket.CLOSED;
      for (const handler of listeners.get('close') ?? []) {
        handler();
      }
    },
  };
  return socket;
}

async function bootstrapFakeRuntime(transport: WsRuntimeTransport, conversationId: string) {
  const socket = createFakeRuntimeSocket();
  (transport as unknown as { spawnRemote: () => Promise<void> }).spawnRemote = async () => {};
  (transport as unknown as { startListener: () => Promise<void> }).startListener = async () => {
    (transport as unknown as { listenerPort: number }).listenerPort = 59999;
    (transport as unknown as { sessionToken: string }).sessionToken = 'test-token';
  };
  (transport as unknown as { waitForRuntimeSocket: () => Promise<void> }).waitForRuntimeSocket = async () => {
    (transport as unknown as { runtimeSocket: FakeRuntimeSocket | null }).runtimeSocket = socket;
    socket.on('close', () => {
      if ((transport as unknown as { runtimeSocket: FakeRuntimeSocket | null }).runtimeSocket === socket) {
        (transport as unknown as { runtimeSocket: FakeRuntimeSocket | null }).runtimeSocket = null;
        (transport as unknown as { handleRuntimeDisconnect: () => void }).handleRuntimeDisconnect();
      }
    });
  };
  (transport as unknown as {
    syncRuntime: (agentId: string, conversationId: string | null) => Promise<void>;
  }).syncRuntime = async (_agentId, _conversationId) => {
    (transport as unknown as { status: { conversationId?: string | null } }).status.conversationId = conversationId;
  };
  return socket;
}

function readyTransportState(transport: WsRuntimeTransport, conversationId: string, socket: FakeRuntimeSocket) {
  (transport as unknown as { runtimeSocket: FakeRuntimeSocket | null }).runtimeSocket = socket;
  (transport as unknown as { status: Record<string, unknown> }).status = {
    ...transport.getStatus(),
    ready: true,
    conversationId,
    agentId: 'agent-ws-test',
    code: 'ready',
  };
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
    const transport = new WsRuntimeTransport(() => win, mockConfig());

    const initPromise = transport.init({ freshConversation: true });
    const socket = await bootstrapFakeRuntime(transport, 'conv-ws-disposable');
    await initPromise;

    expect(transport.getStatus().ready).toBe(true);
    expect(transport.getStatus().conversationId).toBe('conv-ws-disposable');
    expect(transport.getStatus().effectiveTransport).toBe('websocket local');
    expect(smokeMode()).toBe(true);
    expect(transport.getStatus().sessionMode).toBe('smoke');

    socket.close();
    await new Promise((r) => setTimeout(r, 10));
    expect(transport.getStatus().ready).toBe(false);
    expect(transport.getStatus().reason).toContain('disconnected');
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === false)).toBe(true);
    await transport.close();
  });

  test('abort sends abort_message for active run and completes turn', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig());
    const sent: string[] = [];
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        sent.push(payload);
      },
    } as unknown as WebSocket;
    (transport as unknown as { activeRunId: string | null }).activeRunId = 'run-abort-1';
    (transport as unknown as { aborted: boolean }).aborted = false;

    await transport.abort();
    expect((transport as unknown as { aborted: boolean }).aborted).toBe(true);
    const abortPayload = sent.find((payload) => JSON.parse(payload).type === 'abort_message');
    expect(abortPayload).toBeTruthy();
    expect(JSON.parse(abortPayload!).run_id).toBe('run-abort-1');
  });

  test('abort rejects pending permission and sends denied control_response', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig());
    const sent: string[] = [];
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        sent.push(payload);
      },
    } as unknown as WebSocket;
    (transport as unknown as { activeRunId: string | null }).activeRunId = 'run-abort-1';
    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set('upstream-1', 'otto-req-1');
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set('otto-req-1', {
      requestId: 'otto-req-1',
      toolName: 'run_shell',
      resolve: () => {},
    });

    expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(1);

    await transport.abort();

    expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(0);
    expect((transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.size).toBe(0);
    expect((transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.size).toBe(0);

    const controlResponse = sent.find((payload) => JSON.parse(payload).type === 'control_response');
    expect(controlResponse).toBeTruthy();
    const frame = JSON.parse(controlResponse!);
    expect(frame.approved).toBe(false);
    expect(frame.request_id).toBe('upstream-1');
    expect(frame.message).toContain('aborted');

    const abortPayload = sent.find((payload) => JSON.parse(payload).type === 'abort_message');
    expect(abortPayload).toBeTruthy();
  });

  test('abort without an active run id still unblocks the turn (#692)', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig());
    const sent: string[] = [];
    (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
      readyState: WebSocket.OPEN,
      send(payload: string) {
        sent.push(payload);
      },
    } as unknown as WebSocket;
    (transport as unknown as { activeRunId: string | null }).activeRunId = null;
    (transport as unknown as { turnIdle: boolean }).turnIdle = false;

    await transport.abort();

    expect((transport as unknown as { aborted: boolean }).aborted).toBe(true);
    expect((transport as unknown as { turnIdle: boolean }).turnIdle).toBe(true);
    // No run id → no abort_message on the wire, but the local turn is no longer blocked.
    expect(sent.some((payload) => JSON.parse(payload).type === 'abort_message')).toBe(false);
  });

  test('pending WS permission auto-denies after timeout (#691)', async () => {
    const prevTimeout = process.env.OTTO_PERMISSION_TIMEOUT_MS;
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '20';
    try {
      const { win } = mockWindow();
      const transport = new WsRuntimeTransport(() => win, mockConfig());
      const sent: string[] = [];
      (transport as unknown as { runtimeSocket: WebSocket | null }).runtimeSocket = {
        readyState: WebSocket.OPEN,
        send(payload: string) {
          sent.push(payload);
        },
      } as unknown as WebSocket;

      (transport as unknown as { handleControlRequest: (e: unknown) => void }).handleControlRequest({
        type: 'control_request',
        request_id: 'upstream-timeout-1',
        tool_name: 'TimedOutTool',
        tool_input: {},
      });
      expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(1);

      await new Promise((r) => setTimeout(r, 80));

      expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(0);
      const denied = sent
        .map((payload) => JSON.parse(payload))
        .find((frame) => frame.type === 'control_response' && frame.approved === false);
      expect(denied).toBeTruthy();
      expect(String(denied.message)).toContain('timed out');
    } finally {
      if (prevTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_PERMISSION_TIMEOUT_MS');
      else process.env.OTTO_PERMISSION_TIMEOUT_MS = prevTimeout;
    }
  });

  test('resolvePermission emits control_response on runtime socket', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig());
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
    const transport = new WsRuntimeTransport(() => win, mockConfig());
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
    const transport = new WsRuntimeTransport(() => win, mockConfig());
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
    const transport = new WsRuntimeTransport(() => win, mockConfig());

    const initPromise = transport.init({ freshConversation: true });
    const socket = await bootstrapFakeRuntime(transport, 'conv-ws-perm-disconnect');
    await initPromise;

    (transport as unknown as { turnIdle: boolean }).turnIdle = false;
    (transport as unknown as { activeRunId: string | null }).activeRunId = 'run-pending';
    (transport as unknown as { pendingControls: Map<string, unknown> }).pendingControls.set('otto-req-1', {
      requestId: 'otto-req-1',
      toolName: 'AskUserQuestion',
      resolve: () => {},
    });
    (transport as unknown as { controlByUpstream: Map<string, string> }).controlByUpstream.set('upstream-1', 'otto-req-1');

    socket.close();
    await new Promise((r) => setTimeout(r, 10));

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
    const transport = new WsRuntimeTransport(() => win, mockConfig());
    const socket = createFakeRuntimeSocket();
    (transport as unknown as { runtimeSocket: FakeRuntimeSocket | null }).runtimeSocket = socket;

    const detach = (transport as unknown as {
      attachRuntimeHandler: (onEvent: (event: unknown) => void) => (() => void) | null;
    }).attachRuntimeHandler(() => {});
    expect(socket.listenerCount('message')).toBe(1);

    detach?.();
    expect(socket.listenerCount('message')).toBe(0);
  });

  test('turn idle timeout keeps transport ready and emits recoverable error', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig('conv-ws-idle'));
    const socket = createFakeRuntimeSocket();
    readyTransportState(transport, 'conv-ws-idle', socket);
    (transport as unknown as { waitForTurnComplete: () => Promise<void> }).waitForTurnComplete = async () => {
      throw new Error('Timed out waiting for runtime idle');
    };
    (transport as unknown as { sendCommand: () => void }).sendCommand = () => {};
    (transport as unknown as { writeChatReceipt: () => void }).writeChatReceipt = () => {};

    await transport.send('draft while prior turn times out');

    expect(transport.getStatus().ready).toBe(true);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { status?: { ready?: boolean } }).status?.ready === false)).toBe(false);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);
  });

  test('normal turn leaves no stacked message handlers across consecutive sends', async () => {
    const { win } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig('conv-ws-stack'));
    const socket = createFakeRuntimeSocket();
    readyTransportState(transport, 'conv-ws-stack', socket);
    (transport as unknown as { sendCommand: () => void }).sendCommand = () => {};
    (transport as unknown as { writeChatReceipt: () => void }).writeChatReceipt = () => {};
    (transport as unknown as { waitForTurnComplete: (timeoutMs: number, done: () => boolean) => Promise<void> }).waitForTurnComplete =
      async (_timeoutMs, done) => {
        while (!done()) {
          await new Promise((r) => setTimeout(r, 1));
        }
      };

    const sendTurn = async (label: string) => {
      const promise = transport.send(label);
      await new Promise((r) => setTimeout(r, 5));
      socket.emitMessage(JSON.stringify({
        type: 'stream_delta',
        delta: { message_type: 'assistant_message', content: [{ text: label }] },
      }));
      socket.emitMessage(JSON.stringify(loopIdle()));
      await promise;
    };

    await sendTurn('first');
    expect(socket.listenerCount('message')).toBe(0);

    await sendTurn('second');
    expect(socket.listenerCount('message')).toBe(0);
  });

  test('idle-timeout linger delivers late assistant frame before detach', async () => {
    const { win, sent } = mockWindow();
    const transport = new WsRuntimeTransport(() => win, mockConfig('conv-ws-late'));
    const socket = createFakeRuntimeSocket();
    readyTransportState(transport, 'conv-ws-late', socket);
    (transport as unknown as { sendCommand: () => void }).sendCommand = () => {};
    (transport as unknown as { writeChatReceipt: () => void }).writeChatReceipt = () => {};
    (transport as unknown as { waitForTurnComplete: () => Promise<void> }).waitForTurnComplete = async () => {
      throw new Error('Timed out waiting for runtime idle');
    };

    const sendPromise = transport.send('slow turn');
    await sendPromise;

    expect(socket.listenerCount('message')).toBe(1);
    expect(sent.some((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'error')).toBe(true);

    socket.emitMessage(JSON.stringify({
      type: 'stream_delta',
      delta: { message_type: 'assistant_message', content: [{ text: 'late reply' }] },
    }));

    expect(sent.some((e) =>
      e.channel === 'otto:event'
      && (e.payload as { message?: { type?: string; text?: string } }).message?.type === 'assistant'
      && (e.payload as { message?: { text?: string } }).message?.text === 'late reply',
    )).toBe(true);

    socket.emitMessage(JSON.stringify(loopIdle()));
    expect(socket.listenerCount('message')).toBe(0);
  });
});
