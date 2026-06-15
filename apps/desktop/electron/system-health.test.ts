import { describe, expect, test } from 'bun:test';
import type { BrowserWindow } from 'electron';
import { collectSystemHealth, formatSystemHealthHuman } from './system-health';
import type { ConfigStore } from './config-store';
import type { LettaRunner } from './letta-runner';
import type { MemoryStore } from './memory-store';
import type { AutonomyStore } from './autonomy-store';
import type { RoutineStore } from './routine-store';
import type { WorkerStore } from './worker-store';
import type { RunStore } from './run-store';
import type { RuntimeStatus } from './shared/types';

const readyStatus: RuntimeStatus = {
  ready: true,
  code: 'ready',
  agentId: 'agent-123',
  conversationId: 'conv-456',
  model: 'test-model',
  effectiveTransport: 'websocket local',
  transportMode: 'ws',
  wsListenerPort: 7777,
  cliPath: '/tmp/letta',
  cliResolved: true,
  memfsEnabled: true,
  tools: ['read_file'],
};

const offlineStatus: RuntimeStatus = {
  ready: false,
  code: 'unreachable',
  reason: 'Letta unreachable',
  cliPath: '/tmp/letta',
  cliResolved: false,
};

function makeDeps(status: RuntimeStatus, win?: BrowserWindow | null) {
  const runner = { getStatus: () => status } as Pick<LettaRunner, 'getStatus'>;
  const config = {
    get: () => ({ labs: { enabled: false, features: {} } }),
  } as unknown as ConfigStore;
  const memory = {
    listBlocks: async () => ({
      blocks: [{ id: 'human', label: 'human', value: 'hi', limit: null, updated_at: null, description: null }],
      agentId: 'agent-123',
      baseUrl: 'http://127.0.0.1:8283',
      error: null,
    }),
  } as unknown as MemoryStore;
  const autonomy = {
    loadResult: () => ({
      policy: {
        file: '/tmp/policy.yaml',
        zones: [{ id: 'green' }, { id: 'yellow' }, { id: 'red' }],
      },
    }),
  } as unknown as AutonomyStore;
  const routines = {
    listResult: () => ({ dir: '/tmp/routines', routines: [], skipped: [], storage: 'files' as const }),
    activationGate: () => ({ slug: 'x', requiresApproval: false, scheduled: false, allowed: true, reason: 'ok' }),
  } as unknown as RoutineStore;
  const workers = {
    list: () => ({ dir: '/tmp/workers', workers: [], skipped: 0, storage: 'files' as const }),
  } as unknown as WorkerStore;
  const runs = {
    list: () => ({ dir: '/tmp/runs', runs: [], skipped: 0, storage: 'files' as const }),
  } as unknown as RunStore;

  return { win, runner, config, memory, autonomy, routines, workers, runs };
}

describe('collectSystemHealth', () => {
  test('reports ok when runtime is ready and renderer exists', async () => {
    const win = {
      isDestroyed: () => false,
      isFocused: () => true,
      webContents: {
        isDestroyed: () => false,
        executeJavaScript: async () => ({ queued: 0, failed: 0, sending: 0, total: 0 }),
      },
    } as unknown as BrowserWindow;

    const report = await collectSystemHealth(makeDeps(readyStatus, win));
    expect(report.scope).toBe('live');
    expect(report.ok).toBe(true);
    expect(report.checks.find((c) => c.id === 'runtime')?.status).toBe('ok');
    expect(report.checks.find((c) => c.id === 'memory')?.status).toBe('ok');
  });

  test('fails when runtime is offline', async () => {
    const report = await collectSystemHealth(makeDeps(offlineStatus, null));
    expect(report.ok).toBe(false);
    expect(report.checks.find((c) => c.id === 'runtime')?.status).toBe('fail');
    expect(report.checks.find((c) => c.id === 'runtime')?.nextAction).toContain('Settings');
  });

  test('human formatter includes status lines', async () => {
    const report = await collectSystemHealth(makeDeps(offlineStatus, null));
    const text = formatSystemHealthHuman(report);
    expect(text).toContain('NOT OK');
    expect(text).toContain('[FAIL] Runtime connected');
  });
});
