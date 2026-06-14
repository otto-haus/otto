import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import {
  applyLabsConfigPatch,
  defaultLabsConfig,
  getLabsConfig,
  labsConfigToOttoPatch,
  normalizeLabsConfig,
  patchLabsConfig,
} from './labs-config';

/** Mirrors `otto:labs:set` in ipc.ts — Settings → preload → same path. */
function persistLabsIpcSet(store: ConfigStore, patch: Parameters<typeof applyLabsConfigPatch>[1]): ReturnType<typeof applyLabsConfigPatch> {
  const next = applyLabsConfigPatch(store.get(), patch);
  store.update(labsConfigToOttoPatch(next));
  return next;
}

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

  test('normalizes corrupted labs booleans from persisted config', () => {
    const normalized = normalizeLabsConfig({
      enabled: 'yes',
      features: {
        knowledge_cognee: 'true',
        channels_outbound: true,
        bogus_feature: true,
      },
    } as never);
    expect(normalized).toEqual({
      enabled: false,
      features: { channels_outbound: true },
    });
  });

  test('IPC set enables knowledge_cognee (Settings-equivalent persist path)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-labs-ipc-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      expect(getLabsConfig(store.get()).enabled).toBe(false);

      const next = persistLabsIpcSet(store, {
        enabled: true,
        features: { knowledge_cognee: true },
      });
      expect(next).toEqual({
        enabled: true,
        features: { knowledge_cognee: true },
      });

      const reloaded = new ConfigStore();
      expect(getLabsConfig(reloaded.get())).toEqual(next);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('Settings persist shape (full merged object) round-trips via IPC path', () => {
    const prevHome = process.env.OTTO_HOME;
    const tmp = mkdtempSync(join(tmpdir(), 'otto-labs-settings-shape-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      const current = getLabsConfig(store.get());

      const settingsShape = {
        ...current,
        enabled: true,
        features: { ...current.features, channels_outbound: true },
      };
      persistLabsIpcSet(store, settingsShape);

      const onDisk = JSON.parse(readFileSync(join(tmp, 'config.json'), 'utf8'));
      expect(getLabsConfig(onDisk)).toEqual(settingsShape);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      if (prevHome === undefined) delete process.env.OTTO_HOME;
      else process.env.OTTO_HOME = prevHome;
    }
  });
});
