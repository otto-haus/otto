import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { applyLabsConfigPatch, getLabsConfig, labsConfigToOttoPatch } from './labs-config';

describe('ConfigStore', () => {
  test('defaults connectionMode to existing local Letta', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      expect(store.connectionMode()).toBe('existing');
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

  test('falls back when persisted connectionMode is invalid', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      writeFileSync(join(tmp, 'config.json'), `${JSON.stringify({ connectionMode: 'sideways' }, null, 2)}\n`);
      const store = new ConfigStore();
      expect(store.connectionMode()).toBe('existing');
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

  test('labs defaults false on fresh profile', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      expect(getLabsConfig(store.get())).toEqual({ enabled: false, features: {} });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('labs IPC persist matches config-store update path', () => {
    const prevHome = process.env.OTTO_HOME;
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-labs-ipc-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      const next = applyLabsConfigPatch(store.get(), {
        enabled: true,
        features: { culture_export: true },
      });
      store.update(labsConfigToOttoPatch(next));
      const onDisk = JSON.parse(readFileSync(join(tmp, 'config.json'), 'utf8'));
      expect(getLabsConfig(onDisk)).toEqual({
        enabled: true,
        features: { culture_export: true },
      });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      if (prevHome === undefined) delete process.env.OTTO_HOME;
      else process.env.OTTO_HOME = prevHome;
    }
  });

  test('lettaStateDir defaults under OTTO_HOME for embedded mode', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      expect(store.lettaStateDir()).toBe(join(tmp, 'letta'));
      expect(store.ensureLettaStateDir()).toBe(join(tmp, 'letta'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
