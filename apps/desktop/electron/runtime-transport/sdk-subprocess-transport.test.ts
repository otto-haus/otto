import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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

const smokeEnvKeys = ['OTTO_SMOKE', 'OTTO_AGENT_ID', 'OTTO_SKIP_LETTA_LSOF', 'OTTO_HOME', 'LETTA_CLI_PATH', 'OTTO_LETTA_SETTINGS_PATH'] as const;
const originalSmokeEnv = new Map<(typeof smokeEnvKeys)[number], string | undefined>(
  smokeEnvKeys.map((key) => [key, process.env[key]]),
);

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

const mockLettaStateDir = join(tmpdir(), 'otto-test-letta-state');

function mockConfig(): ConfigStore {
  return {
    connectionMode: () => 'existing' as const,
    primaryAgentId: () => 'agent-test',
    modelHandle: () => null,
    effort: () => 'max' as const,
    baseUrl: () => null,
    agentId: () => 'agent-test',
    agentCandidates: () => ['agent-test'],
    lettaStateDir: () => mockLettaStateDir,
    ensureLettaStateDir: () => mockLettaStateDir,
    get: () => ({}),
    update: () => ({}),
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

  test('embedded mode omits stale dead loopback http override when local backend is down', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_AGENT_ID = 'agent-test';
    const staleBase = 'http://127.0.0.1:59647';
    process.env.LETTA_BASE_URL = staleBase;
    const configUpdates: Array<Partial<{ baseUrl: string | null }>> = [];
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'embedded' as const,
      baseUrl: () => staleBase,
      agentCandidates: () => ['agent-test'],
      update: (patch) => {
        configUpdates.push(patch);
        return {};
      },
    } as ConfigStore);

    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-smoke-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    await transport.init({ freshConversation: true });
    expect(process.env.LETTA_BASE_URL).toBeUndefined();
    expect(configUpdates.some((patch) => patch.baseUrl === null)).toBe(true);
  });

  test('embedded init preserves inherited LETTA_API_KEY when secrets.env is empty', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.LETTA_API_KEY = 'inherited-launchctl-key';
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'embedded' as const,
      agentCandidates: () => ['agent-test'],
    } as ConfigStore);

    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-smoke-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    await transport.init({ freshConversation: true });
    expect(process.env.LETTA_API_KEY).toBe('inherited-launchctl-key');
  });

  test('embedded mode omits cloud LETTA_BASE_URL so init does not require LETTA_API_KEY', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.LETTA_BASE_URL = 'https://api.letta.com';
    const configUpdates: Array<Partial<{ baseUrl: string | null }>> = [];
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'embedded' as const,
      baseUrl: () => 'https://api.letta.com',
      agentCandidates: () => ['agent-test'],
      update: (patch) => {
        configUpdates.push(patch);
        return {};
      },
    } as ConfigStore);

    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-smoke-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    await transport.init({ freshConversation: true });
    expect(process.env.LETTA_BASE_URL).toBeUndefined();
    expect(configUpdates.some((patch) => patch.baseUrl === null)).toBe(true);
  });

  test('embedded mode omits stale LETTA_BASE_URL when local backend is down', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.LETTA_BASE_URL = 'local:/Users/seb/.letta/lc-local-backend';
    process.env.OTTO_AGENT_ID = 'agent-test';
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, {
      ...mockConfig(),
      connectionMode: () => 'embedded' as const,
      baseUrl: () => 'local:/Users/seb/.letta/lc-local-backend',
      agentCandidates: () => ['agent-test'],
    } as ConfigStore);

    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-test',
        conversationId: 'conv-smoke-test',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    await transport.init({ freshConversation: true });
    expect(process.env.LETTA_BASE_URL).toBeUndefined();
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

describe('SdkSubprocessTransport permissions', () => {
  test('times out pending permission resolvers', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '40';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

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
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

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

  test('close() denies in-flight permission requests (#695)', async () => {
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

    let resolved: { behavior: string; message?: string } | null = null;
    const timer = setTimeout(() => {}, 60_000);
    (transport as unknown as { pending: Map<string, unknown> }).pending.set('req-close-1', {
      toolName: 'run_shell',
      resolve: (r: { behavior: string; message?: string }) => {
        resolved = r;
      },
      timer,
    });
    expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(1);

    await transport.close();

    expect(transport.getDiagnosticsSnapshot().pendingPermissionCount).toBe(0);
    expect(resolved).not.toBeNull();
    expect(resolved!.behavior).toBe('deny');
    expect(String(resolved!.message)).toContain('closed');
  });

  test('resolvePermission answers pending tool gate', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

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
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

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

describe('SdkSubprocessTransport init', () => {
  test('returns unreachable immediately when existing mode targets down local backend', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const { win } = mockWindow();
    const config = {
      ...mockConfig(),
      connectionMode: () => 'existing' as const,
      baseUrl: () => 'http://127.0.0.1:8283',
    } as unknown as ConfigStore;
    const transport = new SdkSubprocessTransport(() => win, config);

    const status = await transport.init();

    expect(status.ready).toBe(false);
    expect(status.code).toBe('unreachable');
    expect(status.reason).toMatch(/Local Letta backend is not running/i);
  });

  test('times out hung session.initialize() with unreachable status', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    process.env.OTTO_SESSION_INIT_TIMEOUT_MS = '30';
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(() => win, mockConfig());
    let closed = false;
    const session = {
      close: () => { closed = true; },
      initialize: () => new Promise(() => {}),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    const status = await transport.init({ freshConversation: true });

    expect(status.ready).toBe(false);
    expect(status.code).toBe('unreachable');
    expect(status.reason).toMatch(/did not connect in time/i);
    expect(closed).toBe(true);
    Reflect.deleteProperty(process.env, 'OTTO_SESSION_INIT_TIMEOUT_MS');
  });
});

describe('SdkSubprocessTransport turn trail ordering (blocker #2)', () => {
  test('emits final turn_trail before forwarding the terminal result', async () => {
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(() => win, mockConfig());

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
        yield { type: 'tool_call', toolCallId: 'c1', name: 'read_file', arguments: JSON.stringify({ path: 'a.ts' }) };
        yield { type: 'tool_result', toolCallId: 'c1' };
        yield { type: 'assistant', text: 'done', uuid: 'a1' };
        yield { type: 'result', success: true, conversationId: 'conv-test' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: () => session,
      resumeSession: () => session,
    };

    process.env.OTTO_AGENT_ID = 'agent-test';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    await transport.init({ freshConversation: true });

    await transport.send('trail ordering');

    const eventMessages = sent
      .filter((e) => e.channel === 'otto:event')
      .map((e) => (e.payload as { message?: { type?: string; final?: boolean } }).message);
    const finalTrailIdx = eventMessages.findIndex((m) => m?.type === 'turn_trail' && m?.final === true);
    const resultIdx = eventMessages.findIndex((m) => m?.type === 'result');
    expect(finalTrailIdx).toBeGreaterThanOrEqual(0);
    expect(resultIdx).toBeGreaterThanOrEqual(0);
    expect(finalTrailIdx).toBeLessThan(resultIdx);
  });
});

describe('SdkSubprocessTransport smoke bootstrap', () => {
  afterEach(() => {
    for (const key of smokeEnvKeys) {
      const value = originalSmokeEnv.get(key);
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  });

  test('OTTO_SMOKE bootstraps first agent when no agent candidates exist', async () => {
    const home = mkdtempSync(join(tmpdir(), 'otto-smoke-bootstrap-'));
    mkdirSync(join(home, 'letta'), { recursive: true });
    writeFileSync(join(home, 'letta', 'settings.json'), '{}');
    process.env.OTTO_HOME = home;
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    Reflect.deleteProperty(process.env, 'OTTO_AGENT_ID');
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

    const config = new ConfigStore();
    config.update({ connectionMode: 'embedded' });
    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, config);
    const bootstrapCalls: unknown[] = [];
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-smoke-bootstrap',
        conversationId: 'conv-smoke-bootstrap',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {
        yield { type: 'result', success: true, conversationId: 'conv-smoke-bootstrap' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (id: unknown) => {
        bootstrapCalls.push(id);
        return session;
      },
      resumeSession: () => {
        throw new Error('should not resume in smoke bootstrap test');
      },
    };

    const status = await transport.init();
    expect(status.ready).toBe(true);
    expect(bootstrapCalls).toHaveLength(1);
    expect(bootstrapCalls[0] ?? null).toBeNull();
  });

  test('OTTO_SMOKE skips null bootstrap when stale agent candidates remain', async () => {
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    Reflect.deleteProperty(process.env, 'OTTO_AGENT_ID');
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());
    const bootstrapCalls: unknown[] = [];

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (id: unknown) => {
        bootstrapCalls.push(id);
        throw new Error('agent-not-found');
      },
      resumeSession: () => {
        throw new Error('should not resume in smoke stale-candidate test');
      },
    };

    const status = await transport.init();
    expect(status.ready).toBe(false);
    expect(bootstrapCalls.every((id) => id !== null && id !== undefined)).toBe(true);
  });
});