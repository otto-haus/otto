/**
 * Issue #298 — permissioned tool-call round-trip smoke (disposable state, no live Letta/UI).
 * Run: bun scripts/permission-round-trip-smoke.ts  (or task smoke:permission)
 */
import { afterEach, describe, expect, test } from 'bun:test';
import type { BrowserWindow } from 'electron';
import { ConfigStore } from '../config-store';
import { permissionSessionStore } from '../permission-session-store';
import { permissionTimeoutMs, SdkSubprocessTransport } from './sdk-subprocess-transport';

const originalTimeout = process.env.OTTO_PERMISSION_TIMEOUT_MS;
const SMOKE_CONV = 'conv-perm-smoke-298';
const SMOKE_AGENT = 'agent-perm-smoke-298';

afterEach(() => {
  permissionSessionStore.clear();
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
    primaryAgentId: () => SMOKE_AGENT,
    modelHandle: () => null,
    effort: () => 'max' as const,
    baseUrl: () => null,
    agentId: () => SMOKE_AGENT,
    agentCandidates: () => [SMOKE_AGENT],
    get: () => ({}),
    update: () => ({}),
    ensurePrimaryAgentId: () => {},
  } as unknown as ConfigStore;
}

type CanUseTool = (
  toolName: string,
  toolInput: Record<string, unknown>,
) => Promise<{ behavior: string; message?: string; scope?: string }>;

function mockSdkSession(canUseToolRef: { current: CanUseTool | null }) {
  return {
    close: () => {},
    initialize: async () => ({
      agentId: SMOKE_AGENT,
      conversationId: SMOKE_CONV,
      model: 'test-model',
      memfsEnabled: false,
      tools: [],
    }),
    send: async () => {},
    abort: async () => {},
    async *stream() {
      if (!canUseToolRef.current) {
        throw new Error('canUseTool not wired — fix sdk-subprocess-transport session options');
      }
      yield { type: 'result', success: true, conversationId: SMOKE_CONV };
    },
  };
}

function wireTransport(transport: SdkSubprocessTransport, run: (canUseTool: CanUseTool) => Promise<void>) {
  const canUseToolRef: { current: CanUseTool | null } = { current: null };
  const session = mockSdkSession(canUseToolRef);
  session.stream = async function* () {
    if (!canUseToolRef.current) {
      throw new Error('canUseTool not wired — fix sdk-subprocess-transport session options');
    }
    await run(canUseToolRef.current);
    yield { type: 'result', success: true, conversationId: SMOKE_CONV };
  };

  (transport as unknown as { sdk: unknown }).sdk = {
    createSession: (_id: unknown, options: { canUseTool: CanUseTool }) => {
      canUseToolRef.current = options.canUseTool;
      return session;
    },
    resumeSession: (_id: unknown, options: { canUseTool: CanUseTool }) => {
      canUseToolRef.current = options.canUseTool;
      return session;
    },
  };

  process.env.OTTO_AGENT_ID = SMOKE_AGENT;
  process.env.OTTO_SKIP_LETTA_LSOF = '1';
  return canUseToolRef;
}

describe('permission tool-call round-trip (#298)', () => {
  test('allow: request shown, user approves, tool gate resolves allow', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    wireTransport(transport, async (canUseTool) => {
      const response = await canUseTool('run_shell', { cmd: 'echo ok' });
      expect(response.behavior).toBe('allow');
    });

    await transport.init({ freshConversation: true });
    const sendPromise = transport.send('approve permission');
    await new Promise((r) => setTimeout(r, 15));

    const perm = sent.find((e) => e.channel === 'otto:permission');
    expect(perm, 'broken: otto:permission IPC not emitted — wire canUseTool → renderer modal').toBeTruthy();
    const { requestId, toolName } = perm!.payload as { requestId: string; toolName: string };
    expect(toolName).toBe('run_shell');
    transport.resolvePermission(requestId, { behavior: 'allow' });
    await sendPromise;
  });

  test('deny: user decision captured and tool gate returns deny', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    wireTransport(transport, async (canUseTool) => {
      const response = await canUseTool('run_shell', { cmd: 'echo denied' });
      expect(response.behavior).toBe('deny');
      expect(response.message).toBe('Operator denied tool use.');
    });

    await transport.init({ freshConversation: true });
    const sendPromise = transport.send('deny permission');
    await new Promise((r) => setTimeout(r, 15));

    const perm = sent.find((e) => e.channel === 'otto:permission');
    expect(perm, 'broken: permission request not surfaced — check otto:permission IPC').toBeTruthy();
    transport.resolvePermission((perm!.payload as { requestId: string }).requestId, {
      behavior: 'deny',
      message: 'Operator denied tool use.',
    });
    await sendPromise;
  });

  test('session allow: repeat tool skips modal after session-scoped approval', async () => {
    permissionSessionStore.clear();
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '5000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    wireTransport(transport, async (canUseTool) => {
      const first = await canUseTool('run_shell', { cmd: 'echo one' });
      expect(first.behavior).toBe('allow');
      expect(first.scope).toBe('session');
      const second = await canUseTool('run_shell', { cmd: 'echo two' });
      expect(second.behavior).toBe('allow');
      expect(second.scope).toBe('session');
    });

    await transport.init({ freshConversation: true });
    const sendPromise = transport.send('session allow repeat');
    await new Promise((r) => setTimeout(r, 15));

    const perm = sent.find((e) => e.channel === 'otto:permission');
    expect(perm, 'broken: first tool use should emit permission modal').toBeTruthy();
    transport.resolvePermission((perm!.payload as { requestId: string }).requestId, {
      behavior: 'allow',
      scope: 'session',
    });
    await sendPromise;
    expect(
      sent.filter((e) => e.channel === 'otto:permission').length,
      'broken: session allow should skip repeat modal — check permissionSessionStore',
    ).toBe(1);
  });

  test('ui disconnect: unanswered permission times out as deny with actionable message', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '40';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    wireTransport(transport, async (canUseTool) => {
      const response = await canUseTool('run_shell', { cmd: 'echo hi' });
      expect(response.behavior).toBe('deny');
      expect(response.message).toContain('timed out');
    });

    await transport.init({ freshConversation: true });
    const sendPromise = transport.send('trigger permission timeout');
    await new Promise((r) => setTimeout(r, permissionTimeoutMs() + 30));

    expect(sent.some((e) => e.channel === 'otto:permission')).toBe(true);
    await sendPromise;
  });

  test('runtime abort: pending permission rejected and turn completes', async () => {
    process.env.OTTO_PERMISSION_TIMEOUT_MS = '60000';
    const { win, sent } = mockWindow();
    const transport = new SdkSubprocessTransport(win, mockConfig());

    let releaseStream: (() => void) | null = null;
    const canUseToolRef: { current: CanUseTool | null } = { current: null };
    const session = mockSdkSession(canUseToolRef);
    session.stream = async function* () {
      const pending = canUseToolRef.current!('run_shell', { cmd: 'echo hi' });
      await new Promise<void>((resolve) => {
        releaseStream = resolve;
      });
      const response = await pending;
      expect(response.behavior).toBe('deny');
      expect(response.message).toContain('aborted');
      yield { type: 'result', success: false, conversationId: SMOKE_CONV };
    };

    (transport as unknown as { sdk: unknown }).sdk = {
      createSession: (_id: unknown, options: { canUseTool: CanUseTool }) => {
        canUseToolRef.current = options.canUseTool;
        return session;
      },
      resumeSession: (_id: unknown, options: { canUseTool: CanUseTool }) => {
        canUseToolRef.current = options.canUseTool;
        return session;
      },
    };
    process.env.OTTO_AGENT_ID = SMOKE_AGENT;
    process.env.OTTO_SKIP_LETTA_LSOF = '1';

    await transport.init({ freshConversation: true });
    const sendPromise = transport.send('abort during permission');
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.some((e) => e.channel === 'otto:permission')).toBe(true);

    await transport.abort();
    releaseStream?.();
    await sendPromise;

    const terminal = sent.filter(
      (e) =>
        e.channel === 'otto:event' &&
        (e.payload as { message?: { type?: string; success?: boolean } }).message?.type === 'result',
    );
    expect(terminal.length, 'broken: abort should emit terminal result — check emitTurnTerminal').toBeGreaterThan(0);
    expect((terminal.at(-1)?.payload as { message?: { success?: boolean } }).message?.success).toBe(false);
  });
});
