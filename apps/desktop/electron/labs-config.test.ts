import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import {
  applyLabsConfigPatch,
  assertConnectionModePatchAllowed,
  defaultLabsConfig,
  getLabsConfig,
  isImageGenEnabled,
  isPreviewCanvasEnabled,
  isRemoteLettaCloudEnabled,
  isVoiceRealtimeEnabled,
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

  test('IPC set ignores malformed labs patch values before persisting', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-labs-ipc-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      persistLabsIpcSet(store, {
        enabled: true,
        features: { knowledge_cognee: true, channels_outbound: false },
      });

      const next = persistLabsIpcSet(store, {
        enabled: 'yes',
        features: {
          knowledge_cognee: 'false',
          channels_outbound: true,
          bogus_feature: true,
        },
      } as never);

      expect(next).toEqual({
        enabled: true,
        features: { knowledge_cognee: true, channels_outbound: true },
      });
      const onDisk = JSON.parse(readFileSync(join(tmp, 'config.json'), 'utf8'));
      expect(onDisk.labs).toEqual(next);
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

  test('isRemoteLettaCloudEnabled requires master and feature (#628)', () => {
    expect(isRemoteLettaCloudEnabled(defaultLabsConfig())).toBe(false);
    expect(isRemoteLettaCloudEnabled({ enabled: true, features: {} })).toBe(false);
    expect(
      isRemoteLettaCloudEnabled({ enabled: true, features: { remote_letta_cloud: true } }),
    ).toBe(true);
  });

  test('voice_realtime and image_gen require master + feature (#578)', () => {
    expect(isVoiceRealtimeEnabled(defaultLabsConfig())).toBe(false);
    expect(isImageGenEnabled(defaultLabsConfig())).toBe(false);
    expect(
      isVoiceRealtimeEnabled({ enabled: true, features: { voice_realtime: true } }),
    ).toBe(true);
    expect(
      isImageGenEnabled({ enabled: true, features: { image_gen: true } }),
    ).toBe(true);
  });

  test('preview_canvas requires master + feature (#661)', () => {
    expect(isPreviewCanvasEnabled(defaultLabsConfig())).toBe(false);
    expect(
      isPreviewCanvasEnabled({ enabled: true, features: { preview_canvas: true } }),
    ).toBe(true);
  });

  test('assertConnectionModePatchAllowed rejects cloud when Labs gate is off (#628)', () => {
    const cfg = { connectionMode: 'existing' as const, labs: defaultLabsConfig() };
    expect(() => assertConnectionModePatchAllowed(cfg, { connectionMode: 'existing' })).not.toThrow();
    expect(() => assertConnectionModePatchAllowed(cfg, { theme: 'dark' })).not.toThrow();
    expect(() => assertConnectionModePatchAllowed(cfg, { connectionMode: 'cloud' })).toThrow(
      'connectionMode cloud requires Labs master on and remote_letta_cloud enabled',
    );

    const allowed = {
      connectionMode: 'existing' as const,
      labs: { enabled: true, features: { remote_letta_cloud: true } },
    };
    expect(() => assertConnectionModePatchAllowed(allowed, { connectionMode: 'cloud' })).not.toThrow();
  });

  test('IPC config:set path blocks cloud without Labs before persisting (#628)', () => {
    const prevHome = process.env.OTTO_HOME;
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-ipc-cloud-gate-'));
    try {
      process.env.OTTO_HOME = tmp;
      const store = new ConfigStore();
      const patch = { connectionMode: 'cloud' as const };

      expect(() => assertConnectionModePatchAllowed(store.get(), patch)).toThrow();
      expect(store.connectionMode()).toBe('embedded');

      const labsNext = applyLabsConfigPatch(store.get(), {
        enabled: true,
        features: { remote_letta_cloud: true },
      });
      store.update(labsConfigToOttoPatch(labsNext));
      assertConnectionModePatchAllowed(store.get(), patch);
      store.update(patch);
      expect(new ConfigStore().connectionMode()).toBe('cloud');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      if (prevHome === undefined) delete process.env.OTTO_HOME;
      else process.env.OTTO_HOME = prevHome;
    }
  });
});
