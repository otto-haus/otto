import { afterEach, describe, expect, mock, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { IsolatedAgentStore } from './isolated-agent-store';

let tmp: string | null = null;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
  globalThis.fetch = originalFetch;
  delete process.env.OTTO_CONFIG_DIR;
  delete process.env.LETTA_BASE_URL;
});

describe('IsolatedAgentStore (#120)', () => {
  test('requires ADR 093 boundary reason', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-isolated-agent-'));
    process.env.OTTO_CONFIG_DIR = tmp;
    const store = new IsolatedAgentStore(new ConfigStore(), new (await import('./receipt-writer')).ReceiptWriter(join(tmp, 'receipts')));
    await expect(store.create({ boundaryReason: 'not-a-boundary' as never })).rejects.toThrow(/isolation boundary/i);
  });

  test('creates agent via Letta API, records receipt, and stores isolated subtree', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-isolated-agent-'));
    process.env.OTTO_CONFIG_DIR = tmp;
    process.env.LETTA_BASE_URL = 'http://127.0.0.1:8283';

    const config = new ConfigStore();
    config.update({ primaryAgentId: 'agent-primary', baseUrl: 'http://127.0.0.1:8283' });

    globalThis.fetch = mock(async (url: string, init?: { method?: string; body?: string }) => {
      expect(url).toBe('http://127.0.0.1:8283/v1/agents');
      expect(init?.method).toBe('POST');
      const body = JSON.parse(init?.body ?? '{}') as { name?: string };
      expect(body.name).toContain('finance');
      return new Response(JSON.stringify({ id: 'agent-isolated-test' }), { status: 200 });
    }) as typeof fetch;

    const receiptsDir = join(tmp, 'receipts');
    const store = new IsolatedAgentStore(config, new (await import('./receipt-writer')).ReceiptWriter(receiptsDir));
    const result = await store.create({ boundaryReason: 'different_secrets_tools', label: 'finance' });

    expect(result.agent.agentId).toBe('agent-isolated-test');
    expect(result.agent.boundaryReason).toBe('different_secrets_tools');
    expect(result.agent.standardsRatifyBlocked).toBe(true);
    expect(result.receipt.path).toContain('receipts');
    expect(existsSync(result.agent.configPath!)).toBe(true);

    const cfg = JSON.parse(readFileSync(join(tmp, 'config.json'), 'utf8')) as { isolatedAgents?: unknown[] };
    expect(cfg.isolatedAgents?.length).toBe(1);
    expect(store.isIsolatedSecondary('agent-isolated-test')).toBe(true);
    expect(store.isIsolatedSecondary('agent-primary')).toBe(false);
  });
});
