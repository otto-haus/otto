import { afterEach, describe, expect, test } from 'bun:test';
import type { BrowserWindow } from 'electron';
import { ConfigStore } from '../config-store';
import { permissionSessionStore } from '../permission-session-store';
import { permissionTimeoutMs, SdkSubprocessTransport } from './sdk-subprocess-transport';

const originalTimeout = process.env.OTTO_PERMISSION_TIMEOUT_MS;

afterEach(() => {
  if (originalTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_PERMISSION_TIMEOUT_MS');
  else process.env.OTTO_PERMISSION_TIMEOUT_MS = originalTimeout;
});

function mockWindow() {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  const win = {
    webContents: {
      send(channel: string, payload: unknown) {
        sent.push({ channel, payload });
      },
    },
  } as unknown as BrowserWindow;
  return { win, sent };
}

function mockConfig(): ConfigStore {
  return {
    connectionMode: () => 'existing' as const,
    primaryAgentId: () => 'agent-test',
    modelHandle: () => null,
    effort: () => 'max' as const,
    baseUrl: () => null,
    agentId: () => 'agent-test',
    agentCandidates: () => ['agent-test'],
    get: () => ({}),
    update: () => ({}),
    ensurePrimaryAgentId: () => {},
  } as unknown as ConfigStore;
}

describe('SdkSubprocessTransport permissions', () => {
  test('times out pending permission resolvers', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '40';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    let canUseTool: ((toolName: string, toolInput: Record<string, unknown>) => Promise<{ behavior: string; message?: string }>) | null = null;
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {
        if (!canUseTool) throw new Error('canUseTool not wired');
        const response = await canUseTool('run_shell', { cmd: 'echo hi' });
        yield { type: 'assistant', text: String(response.message ?? 'done'), uuid: 'a1' };
        yield { type: 'result', success: true, conversationId: 'conv-test' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
      resumeSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    await transport.init({ freshConversation: true });

    const sendPromise = transport.send('trigger permission');
    await new Promise((r) => setTimeout(r, permissionTimeoutMs() + 30));

    expect(sent.some((e) => e.channel === 'otto:permission')).toBe(true);
    const terminal = sent.filter((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string } }).message?.type === 'result');
    expect(terminal.length).toBeGreaterThan(0);
    await sendPromise;
  });

  test('abort rejects pending permission and emits terminal result', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '60000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    let canUseTool: ((toolName: string, toolInput: Record<string, unknown>) => Promise<{ behavior: string; message?: string }>) | null = null;
    let releaseStream: (() => void) | null = null;
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {
        releaseStream?.();
      },
      async *stream() {
        if (!canUseTool) throw new Error('canUseTool not wired');
        const pending = canUseTool('run_shell', { cmd: 'echo hi' });
        await new Promise<void>((resolve) => {
          releaseStream = resolve;
        });
        await pending;
        yield { type: 'result', success: false, conversationId: 'conv-test' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
      resumeSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    await transport.init({ freshConversation: true });

    const sendPromise = transport.send('trigger permission then abort');
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.some((e) => e.channel === 'otto:permission')).toBe(true);

    await transport.abort();
    releaseStream?.();
    await sendPromise;

    const terminal = sent.filter((e) => e.channel === 'otto:event' && (e.payload as { message?: { type?: string; success?: boolean } }).message?.type === 'result');
    expect(terminal.length).toBeGreaterThan(0);
    expect((terminal.at(-1)?.payload as { message?: { success?: boolean } }).message?.success).toBe(false);
  });

  test('resolvePermission answers pending tool gate', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    let canUseTool: ((toolName: string, toolInput: Record<string, unknown>) => Promise<{ behavior: string }>) | null = null;
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {
        const response = await canUseTool!('run_shell', { cmd: 'echo ok' });
        expect(response.behavior).toBe('allow');
        yield { type: 'result', success: true, conversationId: 'conv-test' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
      resumeSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    await transport.init({ freshConversation: true });

    const sendPromise = transport.send('approve permission');
    await new Promise((r) => setTimeout(r, 15));
    const perm = sent.find((e) => e.channel === 'otto:permission');
    expect(perm).toBeTruthy();
    transport.resolvePermission((perm!.payload as { requestId: string }).requestId, { behavior: 'allow' });
    await sendPromise;
  });

  test('session allow skips modal on repeat tool use', async () => {
    permissionSessionStore.clear();
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    let canUseTool: ((toolName: string, toolInput: Record<string, unknown>) => Promise<{ behavior: string; scope?: string }>) | null = null;
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {
        const first = await canUseTool!('run_shell', { cmd: 'echo one' });
        expect(first.behavior).toBe('allow');
        expect(first.scope).toBe('session');
        const second = await canUseTool!('run_shell', { cmd: 'echo two' });
        expect(second.behavior).toBe('allow');
        expect(second.scope).toBe('session');
        yield { type: 'result', success: true, conversationId: 'conv-test' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
      resumeSession: (_id: unknown, options: { canUseTool: typeof canUseTool }) => {
        canUseTool = options.canUseTool;
        return session;
      },
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    await transport.init({ freshConversation: true });

    const sendPromise = transport.send('session allow repeat');
    await new Promise((r) => setTimeout(r, 15));
    const perm = sent.find((e) => e.channel === 'otto:permission');
    expect(perm).toBeTruthy();
    transport.resolvePermission((perm!.payload as { requestId: string }).requestId, {
      behavior: 'allow',
      scope: 'session',
    });
    await sendPromise;
    expect(sent.filter((e) => e.channel === 'otto:permission').length).toBe(1);
    permissionSessionStore.clear();
  });
});