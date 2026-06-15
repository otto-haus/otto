import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import { DiagnosticsExporter, redactDiagnosticsText, type DiagnosticsExportInput } from './diagnostics-export';

describe('DiagnosticsExporter', () => {
  let ottoDir = '';

  afterEach(() => {
    if (ottoDir) rmSync(ottoDir, { recursive: true, force: true });
  });

  test('export bundle includes snapshot and redacts secrets', () => {
    ottoDir = mkdtempSync(join(tmpdir(), 'otto-diagnostics-export-'));
    const exporter = new DiagnosticsExporter(ottoDir);
    const result = exporter.exportBundle(makeInput(ottoDir));

    expect(existsSync(result.bundlePath)).toBe(true);
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
  });

  test('redactDiagnosticsText strips bearer tokens', () => {
    const redacted = redactDiagnosticsText('Authorization: Bearer abcdefghijklmnopqrstuvwxyz');
    expect(redacted).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(redacted).toContain('[REDACTED]');
  });
});

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
