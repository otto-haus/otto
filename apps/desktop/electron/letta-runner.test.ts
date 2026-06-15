import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { discoverLocalLettaContext, resolveLiveLocalLettaContext } from './runtime-transport/letta-discovery';

const envKeys = ['OTTO_CONFIG_DIR', 'OTTO_LETTA_SETTINGS_PATH', 'OTTO_SKIP_LETTA_LSOF', 'OTTO_AGENT_ID', 'LETTA_BASE_URL'] as const;
const originalEnv = new Map(envKeys.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

function isolatedConfig(settings: unknown): ConfigStore {
  const dir = mkdtempSync(join(tmpdir(), 'otto-config-'));
  const settingsPath = join(dir, 'letta-settings.json');
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  process.env.OTTO_AGENT_ID = '';
  process.env.LETTA_BASE_URL = '';
  process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
  process.env.OTTO_LETTA_SETTINGS_PATH = settingsPath;
  process.env.OTTO_SKIP_LETTA_LSOF = '1';
  return new ConfigStore();
}

describe('discoverLocalLettaContext', () => {
  test('discovers local base URL and agent from Letta sessions when Otto config is empty', () => {
    const config = isolatedConfig({
      sessionsByServer: {
        '127.0.0.1:51087': {
          agentId: 'agent-local-discovered',
          conversationId: 'default',
        },
      },
    });

    expect(discoverLocalLettaContext(config)).toEqual({
      baseUrl: 'http://127.0.0.1:51087',
      agentId: 'agent-local-discovered',
      agentCandidates: ['agent-local-discovered'],
      source: 'Letta local settings/discovery',
      reason: undefined,
    });
  });

  test('uses lastAgent as a local fallback when no session is present', () => {
    const config = isolatedConfig({ lastAgent: 'agent-local-last' });

    expect(discoverLocalLettaContext(config)).toMatchObject({
      agentId: 'agent-local-last',
      agentCandidates: ['agent-local-last'],
      source: 'Letta local settings/discovery',
    });
  });

  test('Otto config overrides discovered Letta settings', () => {
    const config = isolatedConfig({
      sessionsByServer: {
        '127.0.0.1:51087': { agentId: 'agent-local-discovered' },
      },
    });
    config.update({ baseUrl: 'http://127.0.0.1:59999', agentId: 'agent-local-override' });

    expect(discoverLocalLettaContext(config)).toMatchObject({
      baseUrl: 'http://127.0.0.1:59999',
      agentId: 'agent-local-override',
      source: 'otto config/env',
    });
  });
});

async function startHealthServer(): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/v1/health')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no server address');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe('resolveLiveLocalLettaContext stale-port recovery', () => {
  test('falls back from a dead persisted base URL to a live discovered server', async () => {
    const { server, baseUrl: liveBase } = await startHealthServer();
    try {
      // Persisted baseUrl points at a dead port; a live Letta server is recorded in settings.
      const config = isolatedConfig({
        sessionsByServer: {
          [liveBase]: { agentId: 'agent-live-server' },
        },
      });
      config.update({ baseUrl: 'http://127.0.0.1:1' });

      const context = await resolveLiveLocalLettaContext(config);
      expect(context.baseUrl).toBe(liveBase);
      expect(context.agentCandidates).toContain('agent-live-server');
      expect(context.source).toContain('recovered from stale');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('keeps a reachable persisted base URL without switching', async () => {
    const { server, baseUrl: liveBase } = await startHealthServer();
    try {
      const config = isolatedConfig({});
      config.update({ baseUrl: liveBase });

      const context = await resolveLiveLocalLettaContext(config);
      expect(context.baseUrl).toBe(liveBase);
      expect(context.source).toBe('otto config/env');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
