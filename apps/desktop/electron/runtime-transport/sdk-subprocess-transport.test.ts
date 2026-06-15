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

  test('runtime OTTO_SMOKE after module load bootstraps empty candidates with guards active', async () => {
    const home = mkdtempSync(join(tmpdir(), 'otto-smoke-late-bootstrap-'));
    const lettaDir = join(home, 'letta');
    mkdirSync(lettaDir, { recursive: true });
    const settingsPath = join(lettaDir, 'settings.json');
    writeFileSync(settingsPath, '{}');
    process.env.OTTO_HOME = home;
    process.env.OTTO_LETTA_SETTINGS_PATH = settingsPath;
    Reflect.deleteProperty(process.env, 'OTTO_SMOKE');
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    Reflect.deleteProperty(process.env, 'OTTO_AGENT_ID');
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

    const configUpdates: unknown[] = [];
    const config = {
      connectionMode: () => 'embedded' as const,
      primaryAgentId: () => null,
      modelHandle: () => null,
      effort: () => 'max' as const,
      baseUrl: () => null,
      agentId: () => null,
      agentCandidates: () => [],
      lettaStateDir: () => lettaDir,
      get: () => ({}),
      update: (patch: unknown) => {
        configUpdates.push(patch);
      },
      ensurePrimaryAgentId: () => {},
    } as unknown as ConfigStore;

    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, config);
    const bootstrapCalls: unknown[] = [];
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-smoke-late',
        conversationId: 'conv-smoke-late',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {
        yield { type: 'result', success: true, conversationId: 'conv-smoke-late' };
      },
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (id: unknown) => {
        bootstrapCalls.push(id);
        return session;
      },
      resumeSession: () => {
        throw new Error('should not resume in late smoke bootstrap test');
      },
    };

    const status = await transport.init();
    expect(status.ready).toBe(true);
    expect(status.sessionMode).toBe('smoke');
    expect(bootstrapCalls).toHaveLength(1);
    expect(bootstrapCalls[0] ?? null).toBeNull();
    expect(configUpdates).toHaveLength(0);
  });

  test('runtime OTTO_SMOKE after module load refuses conversation=default on bootstrap', async () => {
    const home = mkdtempSync(join(tmpdir(), 'otto-smoke-late-default-'));
    const lettaDir = join(home, 'letta');
    mkdirSync(lettaDir, { recursive: true });
    const settingsPath = join(lettaDir, 'settings.json');
    writeFileSync(settingsPath, '{}');
    process.env.OTTO_HOME = home;
    process.env.OTTO_LETTA_SETTINGS_PATH = settingsPath;
    Reflect.deleteProperty(process.env, 'OTTO_SMOKE');
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    Reflect.deleteProperty(process.env, 'OTTO_AGENT_ID');
    process.env.LETTA_CLI_PATH =
      '/Applications/Letta.app/Contents/Resources/app.asar.unpacked/node_modules/@letta-ai/letta-code/letta.js';

    const configUpdates: unknown[] = [];
    const config = {
      connectionMode: () => 'embedded' as const,
      primaryAgentId: () => null,
      modelHandle: () => null,
      effort: () => 'max' as const,
      baseUrl: () => null,
      agentId: () => null,
      agentCandidates: () => [],
      lettaStateDir: () => lettaDir,
      get: () => ({}),
      update: (patch: unknown) => {
        configUpdates.push(patch);
      },
      ensurePrimaryAgentId: () => {},
    } as unknown as ConfigStore;

    const { win } = mockWindow();
    const transport = new SdkSubprocessTransport(win, config);
    const bootstrapCalls: unknown[] = [];
    const session = {
      close: () => {},
      initialize: async () => ({
        agentId: 'agent-smoke-late',
        conversationId: 'default',
        model: 'test-model',
        memfsEnabled: false,
        tools: [],
      }),
      send: async () => {},
      abort: async () => {},
      async *stream() {},
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (id: unknown) => {
        bootstrapCalls.push(id);
        return session;
      },
      resumeSession: () => {
        throw new Error('should not resume in late smoke default-conversation test');
      },
    };

    const status = await transport.init();
    expect(status.ready).toBe(false);
    expect(status.reason).toMatch(/conversation=default/i);
    expect(bootstrapCalls).toHaveLength(1);
    expect(bootstrapCalls[0] ?? null).toBeNull();
    expect(configUpdates).toHaveLength(0);
  });
});