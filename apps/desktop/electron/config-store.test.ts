import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';

describe('ConfigStore', () => {
  test('defaults connectionMode to embedded', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      expect(store.connectionMode()).toBe('embedded');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('persists connectionMode and primaryAgentId', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      store.update({
        connectionMode: 'existing',
        primaryAgentId: 'agent-primary',
        agentId: 'agent-legacy',
      });
      const reloaded = new ConfigStore();
      expect(reloaded.connectionMode()).toBe('existing');
      expect(reloaded.primaryAgentId()).toBe('agent-primary');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('primaryAgentId falls back to agentId', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      store.update({ agentId: 'agent-fallback', primaryAgentId: null });
      expect(store.primaryAgentId()).toBe('agent-fallback');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
