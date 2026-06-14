import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { defaultLabsConfig, getLabsConfig, normalizeLabsConfig, patchLabsConfig } from './labs-config';

describe('labs-config', () => {
  test('fresh profile defaults labs master off with no features', () => {
    expect(defaultLabsConfig()).toEqual({ enabled: false, features: {} });
    expect(normalizeLabsConfig(undefined)).toEqual({ enabled: false, features: {} });
  });

  test('round-trips master and feature toggles via ConfigStore', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-labs-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      const next = patchLabsConfig(store.get(), {
        enabled: true,
        features: { knowledge_cognee: true, channels_outbound: false },
      });
      store.update({ labs: next });
      const reloaded = new ConfigStore();
      expect(getLabsConfig(reloaded.get())).toEqual({
        enabled: true,
        features: { knowledge_cognee: true, channels_outbound: false },
      });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('migrates legacy per-surface labs shape', () => {
    const migrated = normalizeLabsConfig({ knowledge: true, channels: false, charters: true } as never);
    expect(migrated.enabled).toBe(true);
    expect(migrated.features.knowledge_cognee).toBe(true);
    expect(migrated.features.channels_outbound).toBeUndefined();
  });
});
