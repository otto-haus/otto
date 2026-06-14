import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { MemoryStore } from './memory-store';

describe('MemoryStore', () => {
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
      return new Response(JSON.stringify([{ id: 'b1', label: 'persona', value: 'helpful', limit: 2000 }]), { status: 200 });
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
      new Response(JSON.stringify([{ id: 'b1', label: 'persona', value: 'helpful', limit: 2000 }]), { status: 200 });
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].label).toBe('persona');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('uses /v1/blocks query for local agent ids', async () => {
    const config = new ConfigStore();
    config.update({ agentId: 'agent-local-test', baseUrl: 'local:/tmp/letta-backend' });
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    let calledPath = '';
    globalThis.fetch = async (input) => {
      calledPath = String(input);
      return new Response(JSON.stringify([{ id: 'b1', label: 'human', value: 'Sebastian', limit: 2000 }]), { status: 200 });
    };
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(calledPath).toContain('/v1/blocks?agent_id=agent-local-test');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('encodes agent ids in every fallback memory API path segment', async () => {
    const config = new ConfigStore();
    config.update({ agentId: 'agent/with space', baseUrl: 'http://127.0.0.1:8283' });
    const store = new MemoryStore(config);
    const originalFetch = globalThis.fetch;
    const calledPaths: string[] = [];
    globalThis.fetch = async (input) => {
      calledPaths.push(String(input));
      if (calledPaths.length < 4) return new Response('', { status: 404 });
      return new Response(JSON.stringify([{ id: 'b1', label: 'persona', value: 'helpful' }]), { status: 200 });
    };
    try {
      const result = await store.listBlocks();
      expect(result.error).toBeUndefined();
      expect(result.blocks).toHaveLength(1);
      expect(calledPaths).toHaveLength(4);
      expect(calledPaths[0]).toContain('/v1/blocks?agent_id=agent%2Fwith%20space');
      expect(calledPaths[1]).toContain('/v1/agents/agent%2Fwith%20space/core-memory/blocks');
      expect(calledPaths[2]).toContain('/v1/agents/agent%2Fwith%20space/memory/blocks');
      expect(calledPaths[3]).toContain('/v1/agents/agent%2Fwith%20space/blocks');
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
