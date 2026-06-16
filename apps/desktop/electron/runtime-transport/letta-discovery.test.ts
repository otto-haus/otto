import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from '../config-store';
import { discoverLocalLettaContext, isLocalLettaBackendListening, listLocalLettaModels, probeLettaHttpBaseUrl, resolveInitBaseUrl, resolveLiveLocalLettaContext, resolveModelHandle } from './letta-discovery';
import type { LettaModelOption } from '../shared/types';

const envKeys = ['OTTO_HOME', 'OTTO_LETTA_SETTINGS_PATH', 'OTTO_SKIP_LETTA_LSOF', 'OTTO_AGENT_ID', 'LETTA_BASE_URL'] as const;
const originalEnv = new Map(envKeys.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

describe('discoverLocalLettaContext embedded state', () => {
  test('uses OTTO_HOME/letta settings without host ~/.letta bleed', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-letta-discovery-'));
    try {
      process.env.OTTO_HOME = tmp;
      process.env.OTTO_SKIP_LETTA_LSOF = '1';
      Reflect.deleteProperty(process.env, 'OTTO_LETTA_SETTINGS_PATH');
      const settingsPath = join(tmp, 'letta', 'settings.json');
      mkdirSync(join(tmp, 'letta'), { recursive: true });
      writeFileSync(settingsPath, `${JSON.stringify({ lastAgent: 'agent-embedded-076' }, null, 2)}\n`, 'utf8');
      const config = new ConfigStore();
      config.update({ connectionMode: 'embedded' });
      const context = discoverLocalLettaContext(config);
      expect(context.agentCandidates).toContain('agent-embedded-076');
      expect(process.env.OTTO_LETTA_SETTINGS_PATH).toBe(settingsPath);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('no-agent reason is human copy without settings path (#583)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-letta-discovery-'));
    try {
      process.env.OTTO_HOME = tmp;
      process.env.OTTO_SKIP_LETTA_LSOF = '1';
      Reflect.deleteProperty(process.env, 'OTTO_LETTA_SETTINGS_PATH');
      Reflect.deleteProperty(process.env, 'OTTO_AGENT_ID');
      Reflect.deleteProperty(process.env, 'LETTA_BASE_URL');
      mkdirSync(join(tmp, 'letta'), { recursive: true });
      writeFileSync(join(tmp, 'letta', 'settings.json'), `${JSON.stringify({}, null, 2)}\n`, 'utf8');
      const config = new ConfigStore();
      config.update({ connectionMode: 'embedded' });
      const context = discoverLocalLettaContext(config);
      expect(context.agentCandidates).toHaveLength(0);
      expect(context.reason).toBe('No last local agent or session was found in Letta settings.');
      expect(context.reason).not.toContain('settings.json');
      expect(context.reason).not.toMatch(/\/Users\//);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

const MODELS: LettaModelOption[] = [
  { handle: 'letta/auto', label: 'Auto' },
  { handle: 'openai/gpt-5.5', label: 'GPT 5.5' },
  { handle: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
];

describe('resolveInitBaseUrl', () => {
  test('blocks existing mode when local: backend is down', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('local:/Users/seb/.letta/lc-local-backend', 'existing');
    expect(result.blockReason).toMatch(/Local Letta backend is not running/i);
    expect(result.baseUrl).toBe('local:/Users/seb/.letta/lc-local-backend');
  });

  test('omits base URL in embedded mode so bundled CLI can spawn standalone backend', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('local:/Users/seb/.letta/lc-local-backend', 'embedded');
    expect(result.blockReason).toBeUndefined();
    expect(result.baseUrl).toBeNull();
    expect(result.omitBaseUrl).toBe(true);
  });

  test('omits dead loopback override in embedded mode so bundled CLI can boot fresh', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('http://127.0.0.1:59647', 'embedded');
    expect(result.blockReason).toBeUndefined();
    expect(result.baseUrl).toBeNull();
    expect(result.omitBaseUrl).toBe(true);
    expect(result.clearStaleOverride).toBe(true);
  });

  test('omits Letta Cloud base URL in embedded mode so bundled CLI boots locally', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('https://api.letta.com', 'embedded');
    expect(result.blockReason).toBeUndefined();
    expect(result.baseUrl).toBeNull();
    expect(result.omitBaseUrl).toBe(true);
    expect(result.clearStaleOverride).toBe(true);
  });

  test('passes through Letta Cloud base URL for cloud mode', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('https://api.letta.com', 'cloud');
    expect(result.baseUrl).toBe('https://api.letta.com');
  });

  test('embedded resolveLiveLocalLettaContext drops dead loopback override when nothing is live', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-letta-discovery-'));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
    try {
      process.env.OTTO_HOME = tmp;
      process.env.OTTO_SKIP_LETTA_LSOF = '1';
      mkdirSync(join(tmp, 'letta'), { recursive: true });
      writeFileSync(join(tmp, 'letta', 'settings.json'), `${JSON.stringify({}, null, 2)}\n`, 'utf8');
      const config = new ConfigStore();
      config.update({ connectionMode: 'embedded', baseUrl: 'http://127.0.0.1:59647' });
      const context = await resolveLiveLocalLettaContext(config);
      expect(context.baseUrl).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('passes through http URL for cloud mode when listener check is skipped', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    expect((await resolveInitBaseUrl('http://127.0.0.1:8283', 'cloud')).baseUrl).toBe('http://127.0.0.1:8283');
  });

  test('blocks existing mode when loopback probe fails', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const result = await resolveInitBaseUrl('http://127.0.0.1:59647', 'existing');
    expect(result.blockReason).toMatch(/Local Letta backend is not running/i);
    expect(result.baseUrl).toBe('http://127.0.0.1:59647');
  });

  test('allows reachable loopback http URL when lsof is skipped', async () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/models/')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return originalFetch(input);
    }) as typeof fetch;
    try {
      const result = await resolveInitBaseUrl('http://127.0.0.1:8283', 'existing');
      expect(result.blockReason).toBeUndefined();
      expect(result.baseUrl).toBe('http://127.0.0.1:8283');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('isLocalLettaBackendListening respects OTTO_SKIP_LETTA_LSOF', () => {
    process.env.OTTO_SKIP_LETTA_LSOF = '1';
    expect(isLocalLettaBackendListening()).toBe(false);
  });
});

describe('probeLettaHttpBaseUrl', () => {
  test('returns false for non-http URLs', async () => {
    expect(await probeLettaHttpBaseUrl('local:/Users/seb/.letta/lc-local-backend')).toBe(false);
  });
});

describe('resolveModelHandle', () => {
  test('keeps requested handle when present in discovered models', () => {
    const resolved = resolveModelHandle('anthropic/claude-opus-4-8', MODELS);
    expect(resolved).toEqual({
      requested: 'anthropic/claude-opus-4-8',
      active: 'anthropic/claude-opus-4-8',
      fallbackReason: null,
    });
  });

  test('does not mutate requested when absent from discovery — falls back for active only', () => {
    const resolved = resolveModelHandle('anthropic/claude-sonnet-4', MODELS);
    expect(resolved.requested).toBe('anthropic/claude-sonnet-4');
    expect(resolved.active).toBe('letta/auto');
    expect(resolved.fallbackReason).toContain('anthropic/claude-sonnet-4');
    expect(resolved.fallbackReason).toContain('letta/auto');
    expect(resolved.fallbackReason).toContain('catalog');
  });

  test('returns null active when no models and no preference', () => {
    expect(resolveModelHandle(null, [])).toEqual({
      requested: null,
      active: null,
      fallbackReason: null,
    });
  });

  test('uses default chain when preference is null', () => {
    const resolved = resolveModelHandle(null, MODELS);
    expect(resolved).toEqual({
      requested: null,
      active: 'letta/auto',
      fallbackReason: null,
    });
  });
});

describe('listLocalLettaModels', () => {
  test('maps provider_category from Letta /v1/models/ (#459)', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-letta-models-'));
    try {
      process.env.OTTO_HOME = tmp;
      process.env.OTTO_SKIP_LETTA_LSOF = '1';
      const config = new ConfigStore();
      config.update({ baseUrl: 'http://127.0.0.1:8283' });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        if (String(input).includes('/v1/models/')) {
          return new Response(JSON.stringify([
            {
              handle: 'openai/gpt-5.5',
              display_name: 'GPT 5.5',
              provider_category: 'base',
              provider_name: 'openai',
            },
            {
              handle: 'my-vllm/custom',
              display_name: 'Custom Model',
              provider_category: 'byok',
              provider_name: 'My vLLM',
            },
          ]), { status: 200 });
        }
        return originalFetch(input);
      }) as typeof fetch;
      try {
        const models = await listLocalLettaModels(config);
        expect(models).toEqual([
          {
            handle: 'openai/gpt-5.5',
            label: 'GPT 5.5',
            provider: 'openai',
            displayName: 'GPT 5.5',
            deprecated: false,
            providerCategory: 'base',
          },
          {
            handle: 'my-vllm/custom',
            label: 'Custom Model',
            provider: 'My vLLM',
            displayName: 'Custom Model',
            deprecated: false,
            providerCategory: 'byok',
          },
        ]);
      } finally {
        globalThis.fetch = originalFetch;
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
