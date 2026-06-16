import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import { DiagnosticsExporter, buildRuntimeLogsSummary, redactDiagnosticsText, type DiagnosticsExportInput } from './diagnostics-export';

describe('DiagnosticsExporter', () => {
  let ottoDir = '';

  afterEach(() => {
    if (ottoDir) rmSync(ottoDir, { recursive: true, force: true });
  });

  test('export bundle includes snapshot and redacts secrets', async () => {
    // zipDirectory + ReceiptWriter can exceed bun's 5s default under load (#867 verify:v0 flake).
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-diagnostics-export-'));
    const exporter = new DiagnosticsExporter(ottoDir);
    const result = await exporter.exportBundle(makeInput(ottoDir));

    expect(result.bundlePath.endsWith('.zip')).toBe(true);
    const stagingDir = result.bundlePath.endsWith('.zip')
      ? result.bundlePath.slice(0, -4)
      : result.bundlePath;
    expect(existsSync(join(stagingDir, 'snapshot.json'))).toBe(true);
    expect(existsSync(join(stagingDir, 'manifest.json'))).toBe(true);
    expect(existsSync(join(stagingDir, 'README.txt'))).toBe(true);

    const snapshotText = readFileSync(join(stagingDir, 'snapshot.json'), 'utf8');
    expect(snapshotText).toContain('memoryHealth');
    expect(snapshotText).toContain('permissionRoute');
    expect(/\b(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i.test(snapshotText)).toBe(false);
    expect(snapshotText).not.toContain('super-secret-token-value-1234567890');
  }, 15_000);

  test('redactDiagnosticsText strips bearer tokens', () => {
    const redacted = redactDiagnosticsText('Authorization: Bearer abcdefghijklmnopqrstuvwxyz');
    expect(redacted).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(redacted).toContain('[REDACTED]');
  });

  test('snapshot records window launch mode/env, theme, and Letta discovery (#684/#689/#609)', async () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-diagnostics-window-'));
    const prevMode = process.env.OTTO_WINDOW_MODE;
    const prevSmoke = process.env.OTTO_SMOKE;
    const prevSettings = process.env.OTTO_LETTA_SETTINGS_PATH;
    process.env.OTTO_WINDOW_MODE = 'background';
    process.env.OTTO_SMOKE = '1';
    process.env.OTTO_LETTA_SETTINGS_PATH = '/tmp/letta/settings.json';
    try {
      const input = makeInput(ottoDir);
      input.config.theme = 'dark';
      input.runtimeStatus.discoverySource = 'config.json';
      input.window = {
        visible: false,
        minimized: false,
        maximized: true,
        bounds: { x: 100, y: 50, width: 1280, height: 800 },
        savedBounds: { x: 100, y: 50, width: 1280, height: 800, isMaximized: true },
      };

      const result = await new DiagnosticsExporter(ottoDir).exportBundle(input);
      const stagingDir = result.bundlePath.endsWith('.zip')
        ? result.bundlePath.slice(0, -4)
        : result.bundlePath;
      const snapshot = JSON.parse(readFileSync(join(stagingDir, 'snapshot.json'), 'utf8')) as Record<string, any>;

      expect(snapshot.window.launchMode).toBe('background');
      expect(snapshot.window.ottoWindowMode).toBe('background');
      expect(snapshot.window.ottoSmoke).toBe('1');
      expect(snapshot.window.maximized).toBe(true);
      expect(snapshot.window.bounds).toEqual({ x: 100, y: 50, width: 1280, height: 800 });
      expect(snapshot.window.savedBounds).toEqual({
        x: 100,
        y: 50,
        width: 1280,
        height: 800,
        isMaximized: true,
      });
      expect(snapshot.config.theme).toBe('dark');
      expect(snapshot.lettaDiscovery.discoverySource).toBe('config.json');
      expect(snapshot.lettaDiscovery.lettaSettingsPathEnv).toBe('/tmp/letta/settings.json');
    } finally {
      restoreEnv('OTTO_WINDOW_MODE', prevMode);
      restoreEnv('OTTO_SMOKE', prevSmoke);
      restoreEnv('OTTO_LETTA_SETTINGS_PATH', prevSettings);
    }
  }, 15_000);

  test('buildRuntimeLogsSummary includes redacted electron main tail', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-diagnostics-logs-'));
    const userData = join(ottoDir, 'user-data');
    const logsDir = join(userData, 'logs');
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(join(logsDir, 'main.log'), 'boot ok\nAuthorization: Bearer super-secret-token-value-1234567890\n');

    const summary = buildRuntimeLogsSummary(userData);
    expect(summary.logsFolder).toContain('logs');
    const main = summary.entries.find((entry) => entry.id === 'main');
    expect(main?.tail).toContain('boot ok');
    expect(main?.tail).not.toContain('super-secret-token-value-1234567890');
    expect(summary.entries.some((entry) => entry.id === 'latest-trace')).toBe(true);
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function makeInput(ottoDir: string): DiagnosticsExportInput {
  return {
    buildInfo: {
      sha: 'abc123',
      shortSha: 'abc123',
      builtAt: '2026-06-14T00:00:00.000Z',
      branch: 'main',
      channel: 'dev',
      version: '0.0.0',
      appPath: '/Applications/otto.app',
      profilePath: join(ottoDir, 'profile'),
      homePath: '/Users/test',
      mainSha: 'abc123',
      mainShortSha: 'abc123',
      matchesMain: true,
    },
    runtimeStatus: {
      ready: false,
      reason: 'not initialized',
      code: 'error',
      cliPath: 'letta',
      cliResolved: false,
    },
    config: {
      agentId: 'agent-1',
      conversationId: 'conv-1',
      activeThreadId: 'thread-1',
    },
    userDataPath: join(ottoDir, 'user-data'),
    ottoDir,
    permissionSession: ['Read'],
    transport: {
      activeTransport: 'sdk',
      sdk: { pendingPermissionCount: 1, sessionInitialized: false, aborted: false },
      ws: {
        pendingPermissionCount: 0,
        wsConnected: null,
        wsReadyState: null,
        listenerPort: null,
        activeRunId: null,
        turnIdle: true,
        lastReconnectAt: null,
        aborted: false,
      },
    },
    threads: {
      dir: join(ottoDir, 'threads'),
      activeThreadId: 'thread-1',
      threads: [{
        id: 'thread-1',
        lettaConversationId: 'conv-1',
        agentId: 'agent-1',
        title: 'private chat title',
        createdAt: '2026-06-14T00:00:00.000Z',
        updatedAt: '2026-06-14T00:00:00.000Z',
        pinned: false,
        archived: false,
      }],
    },
    memory: {
      agentId: 'agent-1',
      baseUrl: 'http://127.0.0.1:8283',
      apiPath: '/v1/blocks',
      blocks: [{
        id: 'human',
        label: 'human',
        value: 'secret memory content api_key=super-secret-token-value-1234567890',
        limit: 5000,
        updated_at: null,
        description: null,
      }],
    },
    routines: {
      dir: join(ottoDir, 'routines'),
      routines: [],
      skipped: [],
      storage: 'files',
    },
    cognee: {
      status: 'disabled',
      baseUrl: null,
      lastError: null,
      lastCheckedAt: null,
    },
    pgvector: {
      enabled: false,
      available: false,
      state: 'disabled',
      connectionHint: null,
      lastCheckedAt: '2026-06-14T00:00:00.000Z',
      lastIndexedAt: null,
      note: 'not configured',
      error: null,
    },
  };
}
