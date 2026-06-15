import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { isLocalLettaAgentId, lettaMemoryUserMessage, memoryListBlockedResult, MemoryStore } from './memory-store';
import { APIError } from '@letta-ai/letta-client';

const DISPOSABLE_AGENT_ID = 'agent-disposable-memory-290';
const DISPOSABLE_CONVERSATION_ID = 'conv-disposable-memory-290';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function disposableFixtureDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
  process.env.OTTO_LETTA_SETTINGS_PATH = join(dir, 'letta-settings.json');
  process.env.OTTO_AGENT_ID = '';
  process.env.LETTA_BASE_URL = '';
  writeFileSync(process.env.OTTO_LETTA_SETTINGS_PATH, JSON.stringify({
    sessionsByServer: {
      '127.0.0.1:8283': {
        agentId: DISPOSABLE_AGENT_ID,
        conversationId: DISPOSABLE_CONVERSATION_ID,
      },
    },
  }));
  return dir;
}

describe('MemoryStore', () => {
  test('isLocalLettaAgentId recognizes agent-local prefix', () => {
    expect(isLocalLettaAgentId('agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2')).toBe(true);
    expect(isLocalLettaAgentId('agent-12345678-1234-4123-8123-123456789abc')).toBe(false);
  });

  test('memoryListBlockedResult returns empty blocks without Letta HTTP (#715)', () => {
    const blocked = memoryListBlockedResult({ agentId: 'agent-test', reason: 'Runtime not ready' });
    expect(blocked.blocks).toEqual([]);
    expect(blocked.baseUrl).toBeNull();
    expect(blocked.error).toBe('Runtime not ready');
    expect(blocked.agentId).toBe('agent-test');
  });

  test('lettaMemoryUserMessage hides raw 422 JSON', () => {
    const raw = new APIError(
      422,
      undefined,
      '422 {"trace_id":"abc","detail":"[{\"type\":\"string_pattern_mismatch\"}]"}',
      undefined,
    );
    const message = lettaMemoryUserMessage(raw);
    expect(message).toBe('Core memory blocks are not available for this agent in the current runtime state.');
    expect(message).not.toContain('trace_id');
    expect(message).not.toContain('string_pattern_mismatch');
  });

  test('returns honest error when agent is missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-mem-empty-'));
    process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
    process.env.OTTO_LETTA_SETTINGS_PATH = join(dir, 'letta-settings.json');
    process.env.OTTO_AGENT_ID = '';
    process.env.LETTA_BASE_URL = '';
    writeFileSync(process.env.OTTO_LETTA_SETTINGS_PATH, '{}');
    const config = new ConfigStore();
    config.update({ agentId: null, baseUrl: null });
    const store = new MemoryStore(config);
    const result = await store.listBlocks();
    expect(result.blocks).toEqual([]);
    expect(result.error).toMatch(/No local Letta agent|connect runtime|no last local agent/i);
  });

  test('discovers agent from Letta settings when Otto config empty', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-mem-disc-'));
    process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
    process.env.OTTO_LETTA_SETTINGS_PATH = join(dir, 'letta-settings.json');
    process.env.OTTO_AGENT_ID = '';
    process.env.LETTA_BASE_URL = '';
    writeFileSync(process.env.OTTO_LETTA_SETTINGS_PATH, JSON.stringify({
      sessionsByServer: {
        '127.0.0.1:8283': { agentId: 'agent_discovered', conversationId: 'default' },
      },
    }));
    const config = new ConfigStore();
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    let calledPath = '';
    globalThis.fetch = async (input) => {
      calledPath = String(input);
      return jsonResponse([{ id: 'b1', label: 'persona', value: 'helpful', limit: 2000 }]);
    };
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.agentId).toBe('agent_discovered');
      expect(result.blocks).toHaveLength(1);
      expect(calledPath).toContain('agent_discovered');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('normalizes blocks from API payload', async () => {
    const config = new ConfigStore();
    config.update({ agentId: 'agent_test', baseUrl: 'http://127.0.0.1:8283' });
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      jsonResponse([{ id: 'b1', label: 'persona', value: 'helpful', limit: 2000 }]);
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].label).toBe('persona');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('uses blocks query path for local agent ids', async () => {
    const config = new ConfigStore();
    config.update({ agentId: 'agent-local-test', baseUrl: 'local:/tmp/letta-backend' });
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    let calledPath = '';
    globalThis.fetch = async (input) => {
      calledPath = String(input);
      return jsonResponse([{ id: 'b1', label: 'human', value: 'Sebastian', limit: 2000 }]);
    };
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(calledPath).toContain('/v1/blocks/?agent_id=agent-local-test');
      expect(calledPath).not.toContain('/core-memory/blocks');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('encodes agent ids in blocks query path', async () => {
    const config = new ConfigStore();
    config.update({ agentId: 'agent/with space', baseUrl: 'http://127.0.0.1:8283' });
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    let calledPath = '';
    globalThis.fetch = async (input) => {
      calledPath = String(input);
      return jsonResponse([{ id: 'b1', label: 'persona', value: 'helpful' }]);
    };
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(calledPath).toContain('/v1/blocks/?agent_id=agent%2Fwith%20space');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('searchBlocks filters by label and value', () => {
    const store = new MemoryStore(new ConfigStore());
    const blocks = [
      { id: '1', label: 'persona', value: 'direct', limit: null, updated_at: null, description: null },
      { id: '2', label: 'human', value: 'Sebastian', limit: null, updated_at: null, description: null },
    ];
    expect(store.searchBlocks('sebastian', blocks)).toHaveLength(1);
    expect(store.searchBlocks('', blocks)).toHaveLength(2);
  });
});

describe('MemoryStore load/update round-trip (#290)', () => {
  test('loads memory for disposable agent fixture', async () => {
    disposableFixtureDir('otto-mem-load-290-');
    const config = new ConfigStore();
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      expect(url).toContain(DISPOSABLE_AGENT_ID);
      expect(url).not.toContain('conversation=default');
      return jsonResponse([
        { id: 'b1', label: 'persona', value: 'seed-290', limit: 2000 },
      ]);
    };
    try {
      const result = await store.listBlocks();
      if (result.error) throw new Error(`LOAD failed: ${result.error}`);
      expect(result.agentId).toBe(DISPOSABLE_AGENT_ID);
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].value).toBe('seed-290');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('updates memory and observes persisted value after reload', async () => {
    disposableFixtureDir('otto-mem-roundtrip-290-');
    const config = new ConfigStore();
    const store = new MemoryStore(config);
    const state = { persona: 'seed-290-before' };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as { value?: string };
        if (!body.value) throw new Error('UPDATE failed: PATCH body missing value');
        state.persona = body.value;
        return jsonResponse({
          id: 'b1',
          label: 'persona',
          value: body.value,
          limit: 2000,
        });
      }
      if (url.includes('/core-memory/blocks')) {
        return jsonResponse([
          { id: 'b1', label: 'persona', value: state.persona, limit: 2000 },
        ]);
      }
      return new Response('', { status: 404 });
    };
    try {
      const loadBefore = await store.listBlocks();
      if (loadBefore.error) throw new Error(`LOAD failed: ${loadBefore.error}`);
      expect(loadBefore.blocks[0]?.value).toBe('seed-290-before');

      const updatedValue = 'seed-290-after-reload';
      const update = await store.updateBlock('persona', updatedValue);
      if (update.error) throw new Error(`UPDATE failed: ${update.error}`);
      expect(update.block?.value).toBe(updatedValue);

      const loadAfter = await store.listBlocks();
      if (loadAfter.error) throw new Error(`PERSISTENCE reload failed: ${loadAfter.error}`);
      expect(loadAfter.blocks.find((b) => b.label === 'persona')?.value).toBe(updatedValue);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('isolation: disposable fixture never uses default conversation', () => {
    const dir = disposableFixtureDir('otto-mem-isolation-290-');
    const settings = JSON.parse(readFileSync(join(dir, 'letta-settings.json'), 'utf8')) as {
      sessionsByServer: Record<string, { agentId: string; conversationId: string }>;
    };
    const session = settings.sessionsByServer['127.0.0.1:8283'];
    if (!session) throw new Error('ISOLATION failed: missing disposable session fixture');
    expect(session.conversationId).toBe(DISPOSABLE_CONVERSATION_ID);
    expect(session.conversationId).not.toBe('default');
    expect(session.agentId).toBe(DISPOSABLE_AGENT_ID);
    expect(session.agentId).not.toBe('default');
  });
});

const memoryIntegrationEnabled = process.env.OTTO_MEMORY_INTEGRATION === '1';

(memoryIntegrationEnabled ? describe : describe.skip)(
  'MemoryStore live Letta integration (OTTO_MEMORY_INTEGRATION=1)',
  () => {
    test('load/update round-trip against local runtime disposable agent', async () => {
      const agentId = process.env.OTTO_MEMORY_TEST_AGENT_ID?.trim();
      const baseUrl = process.env.OTTO_MEMORY_TEST_BASE_URL?.trim() ?? 'http://127.0.0.1:8283';
      if (!agentId || agentId === 'default') {
        throw new Error('ISOLATION failed: set OTTO_MEMORY_TEST_AGENT_ID to a disposable agent id');
      }

      const dir = mkdtempSync(join(tmpdir(), 'otto-mem-live-290-'));
      process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
      process.env.OTTO_LETTA_SETTINGS_PATH = join(dir, 'letta-settings.json');
      process.env.OTTO_AGENT_ID = agentId;
      process.env.LETTA_BASE_URL = baseUrl;
      writeFileSync(process.env.OTTO_LETTA_SETTINGS_PATH, JSON.stringify({
        sessionsByServer: {
          '127.0.0.1:8283': {
            agentId,
            conversationId: process.env.OTTO_MEMORY_TEST_CONVERSATION_ID ?? 'conv-memory-integration-290',
          },
        },
      }));

      const config = new ConfigStore();
      config.update({ agentId, baseUrl });
      const store = new MemoryStore(config);
      const label = process.env.OTTO_MEMORY_TEST_BLOCK_LABEL?.trim() ?? 'persona';
      const marker = `otto-290-${Date.now()}`;

      const loadBefore = await store.listBlocks();
      if (loadBefore.error) throw new Error(`LOAD failed: ${loadBefore.error}`);
      const before = loadBefore.blocks.find((b) => b.label === label);
      if (!before) throw new Error(`LOAD failed: block label "${label}" not found`);

      const update = await store.updateBlock(label, marker);
      if (update.error) throw new Error(`UPDATE failed: ${update.error}`);

      const loadAfter = await store.listBlocks();
      if (loadAfter.error) throw new Error(`PERSISTENCE reload failed: ${loadAfter.error}`);
      const after = loadAfter.blocks.find((b) => b.label === label);
      if (!after || after.value !== marker) {
        throw new Error(`PERSISTENCE failed: expected "${marker}", got "${after?.value ?? ''}"`);
      }

      await store.updateBlock(label, before.value);
    });
  },
);
