import { describe, expect, test, mock, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import {
  buildProviderMirrorRows,
  connectByokProvider,
  getByokConnectSpec,
} from './provider-connect';
import { buildProviderMirror } from './provider-mirror';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.OTTO_HOME;
});

describe('provider-connect', () => {
  test('maps OpenRouter registration to connected mirror row', () => {
    const rows = buildProviderMirrorRows(
      [{ name: 'lc-openrouter', provider_type: 'openrouter', provider_category: 'byok' }],
      ['openrouter/anthropic/claude-sonnet-4'],
    );
    const openrouter = rows.find((row) => row.id === 'openrouter');
    expect(openrouter?.status).toBe('connected');
    expect(openrouter?.connected).toBe(true);
  });

  test('connectByokProvider posts write-only payload and never echoes api key', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-byok-connect-'));
    process.env.OTTO_HOME = tmp;
    const config = new ConfigStore();
    config.update({ baseUrl: 'http://127.0.0.1:8283' });

    const submittedKey = 'providerMirrorAuditFakeSecret0123456789';
    const requests: Array<{ method: string; url: string; body?: string }> = [];

    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ method: init?.method ?? 'GET', url, body: init?.body as string | undefined });
      if (url.endsWith('/v1/providers/') && init?.method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.endsWith('/v1/providers/') && init?.method === 'POST') {
        return new Response(JSON.stringify({ id: 'prov-1', name: 'lc-openrouter' }), { status: 200 });
      }
      if (url.endsWith('/v1/models/')) {
        return new Response(JSON.stringify([
          { handle: 'openrouter/test-model', provider_category: 'byok' },
        ]), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await connectByokProvider(config, true, {
      providerId: 'openrouter',
      apiKey: submittedKey,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('connected');
    expect(result.mirror.providers.find((row) => row.id === 'openrouter')?.connected).toBe(true);
    expect(JSON.stringify(result)).not.toContain(submittedKey);

    const post = requests.find((req) => req.method === 'POST');
    expect(post?.body).toContain('"provider_type":"openrouter"');
    expect(post?.body).toContain('"api_key"');
    expect(JSON.stringify({ mirror: result.mirror, ipc: result })).not.toContain(submittedKey);

    rmSync(tmp, { recursive: true, force: true });
  });

  test('custom OpenAI-compatible connect sends base_url without persisting key in mirror', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-byok-custom-'));
    process.env.OTTO_HOME = tmp;
    const config = new ConfigStore();
    config.update({ baseUrl: 'http://127.0.0.1:8283' });

    let postBody = '';
    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/v1/providers/') && init?.method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.endsWith('/v1/providers/') && init?.method === 'POST') {
        postBody = String(init.body);
        return new Response(JSON.stringify({ id: 'prov-2', name: 'lc-custom-openai' }), { status: 200 });
      }
      if (url.endsWith('/v1/models/')) {
        return new Response(JSON.stringify([{ handle: 'openai-proxy/local-model' }]), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await connectByokProvider(config, false, {
      providerId: 'openai_compat',
      baseUrl: 'http://127.0.0.1:1234/v1',
    });

    expect(result.ok).toBe(true);
    expect(postBody).toContain('"base_url":"http://127.0.0.1:1234/v1"');
    expect(getByokConnectSpec('openai_compat')?.providerType).toBe('openai');

    rmSync(tmp, { recursive: true, force: true });
  });

  test('buildProviderMirror delegates to async provider rows', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-byok-mirror-'));
    process.env.OTTO_HOME = tmp;
    const config = new ConfigStore();
    config.update({ baseUrl: 'http://127.0.0.1:8283', agentId: 'agent-1' });

    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/providers/')) {
        return new Response(JSON.stringify([{ name: 'lc-ollama', provider_type: 'ollama' }]), { status: 200 });
      }
      if (url.endsWith('/v1/models/')) {
        return new Response(JSON.stringify([{ handle: 'ollama/llama3.2' }]), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const mirror = await buildProviderMirror(config, true);
    expect(mirror.providers.find((row) => row.id === 'ollama')?.connected).toBe(true);
    expect(mirror.modelCount).toBe(1);

    rmSync(tmp, { recursive: true, force: true });
  });
});
