import { afterEach, describe, expect, test } from 'bun:test';
import type { BrowserWindow } from 'electron';
import { ConfigStore } from '../config-store';
import { permissionSessionStore } from '../permission-session-store';
import { permissionTimeoutMs, SdkSubprocessTransport } from './sdk-subprocess-transport';
import { sessionInitTimeoutMs } from './runtime-common';

const originalTimeout = process.env.OTTO_PERMISSION_TIMEOUT_MS;
const originalInitTimeout = process.env.OTTO_SESSION_INIT_TIMEOUT_MS;

afterEach(() => {
  if (originalTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_PERMISSION_TIMEOUT_MS');
  else process.env.OTTO_PERMISSION_TIMEOUT_MS = originalTimeout;
  if (originalInitTimeout === undefined) Reflect.deleteProperty(process.env, 'OTTO_SESSION_INIT_TIMEOUT_MS');
  else process.env.OTTO_SESSION_INIT_TIMEOUT_MS = originalInitTimeout;
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

function mockConfig(input: { conversationId?: string | null; updates?: Array<Record<string, unknown>> } = {}): ConfigStore {
  const state: Record<string, unknown> = {
    conversationId: input.conversationId ?? null,
  };
  return {
    connectionMode: () => 'existing' as const,
    primaryAgentId: () => 'agent-test',
    modelHandle: () => null,
    effort: () => 'max' as const,
    baseUrl: () => null,
    agentId: () => 'agent-test',
    agentCandidates: () => ['agent-test'],
    get: () => state,
    update: (patch: Record<string, unknown>) => {
      Object.assign(state, patch);
      input.updates?.push(patch);
      return state;
    },
    ensurePrimaryAgentId: () => {},
  } as unknown as ConfigStore;
}

describe('SdkSubprocessTransport init resilience', () => {
  test('preflight fails fast for existing mode when local backend is down', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'existing' as const,
      baseUrl: () => 'local:/Users/seb/.letta/lc-local-backend',
      agentCandidates: () => ['agent-test'],
    } as ConfigStore);

    const status = await transport.init();
    expect(status.ready).toBe(false);
    expect(status.code).toBe('unreachable');
    expect(status.reason).toMatch(/Local Letta backend is not running/i);
  });

  test('session.initialize timeout returns unreachable instead of hanging', async () => {
    process.env.OTTO_SESSION_INIT_TIMEOUT_MS = '30';
    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_LETTA_SETTINGS_PATH = `/tmp/otto-letta-settings-missing-${Date.now()}.json`;
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'existing' as const,
      baseUrl: () => null,
    } as ConfigStore);

    const session = {
      close: () => {},
      initialize: () => new Promise(() => {}),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    const started = Date.now();
    const status = await transport.init({ freshConversation: true });
    expect(Date.now() - started).toBeLessThan(sessionInitTimeoutMs() + 500);
    expect(status.ready).toBe(false);
    expect(status.code).toBe('unreachable');
    expect(status.reason).toMatch(/did not connect in time/i);
  });
});

describe('SdkSubprocessTransport initialization', () => {
  test('resumes stored local conversations through the conversation option', async () => {
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig({ conversationId: 'local-conv-existing' }));
    const calls: Array<{ method: string; id: unknown; options: Record<string, unknown> }> = [];
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'local-conv-existing',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (id: unknown, options: Record<string, unknown>) => {
        calls.push({ method: 'createSession', id, options });
        return session;
      },
      resumeSession: (id: unknown, options: Record<string, unknown>) => {
        calls.push({ method: 'resumeSession', id, options });
        return session;
      },
    };

    const status = await transport.init();

    expect(status.ready).toBe(true);
    expect(calls[0]?.method).toBe('createSession');
    expect(calls[0]?.id).toBeUndefined();
    expect(calls[0]?.options.conversationId).toBe('local-conv-existing');
    expect(calls.some((call) => call.method === 'resumeSession')).toBe(false);
  });

  test('reports stale when a stored local conversation no longer exists', async () => {
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig({ conversationId: 'local-conv-missing' }));
    const session = {
      close: () => {},
      initialize: async () => {
        throw new Error('500 {"error":"Conversation local-conv-missing not found"}');
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    const status = await transport.init();

    expect(status.ready).toBe(false);
    expect(status.code).toBe('stale');
    expect(status.reason).toContain('stale');
  });
});

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