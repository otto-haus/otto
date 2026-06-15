import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import {
  applyDreamSettingsPatch,
  applyEmbeddedLettaSettingsEnv,
  DEFAULT_DREAM_SETTINGS,
  getDreamSettings,
  readDreamSettingsFromLetta,
  resolveLettaSettingsPath,
  syncDreamSettingsToLetta,
} from './dream-settings';

const envKeys = ['OTTO_CONFIG_DIR', 'OTTO_LETTA_SETTINGS_PATH', 'LETTA_SETTINGS_PATH', 'LETTA_MEMORY_DIR'] as const;
const originalEnv = new Map(envKeys.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

function isolatedConfig(): ConfigStore {
  const dir = mkdtempSync(join(tmpdir(), 'otto-dream-'));
  process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
  process.env.OTTO_LETTA_SETTINGS_PATH = join(dir, 'letta-settings.json');
  return new ConfigStore();
}

describe('dream-settings', () => {
  test('defaults to compaction-event trigger with step count 25', () => {
    expect(getDreamSettings({})).toEqual(DEFAULT_DREAM_SETTINGS);
  });

  test('normalizes invalid patch values', () => {
    const next = applyDreamSettingsPatch({}, {
      trigger: 'bogus' as never,
      stepCount: -3,
    });
    expect(next).toEqual(DEFAULT_DREAM_SETTINGS);
  });

  test('persists step-count trigger to Letta settings file', () => {
    const config = isolatedConfig();
    const settingsPath = process.env.OTTO_LETTA_SETTINGS_PATH!;
    syncDreamSettingsToLetta('agent-dream', { trigger: 'step-count', stepCount: 12 }, settingsPath);

    const onDisk = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(onDisk.reflectionSettingsByAgent['agent-dream']).toEqual({
      trigger: 'step-count',
      stepCount: 12,
    });
    expect(onDisk.memoryReminderInterval).toBe(12);
    expect(onDisk.reflectionTrigger).toBe('step-count');
    expect(onDisk.reflectionStepCount).toBe(12);
  });

  test('reads agent-scoped dreaming settings from Letta settings file', () => {
    const config = isolatedConfig();
    const settingsPath = process.env.OTTO_LETTA_SETTINGS_PATH!;
    syncDreamSettingsToLetta('agent-read', { trigger: 'off', stepCount: 25 }, settingsPath);

    expect(readDreamSettingsFromLetta('agent-read', settingsPath)).toEqual({
      trigger: 'off',
      stepCount: 25,
    });
  });

  test('resolveLettaSettingsPath honors OTTO_LETTA_SETTINGS_PATH', () => {
    const config = isolatedConfig();
    expect(resolveLettaSettingsPath(config, 'existing')).toBe(process.env.OTTO_LETTA_SETTINGS_PATH);
  });

  test('embedded mode resolves settings under OTTO_HOME/letta', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-dream-embedded-'));
    process.env.OTTO_HOME = dir;
    Reflect.deleteProperty(process.env, 'OTTO_LETTA_SETTINGS_PATH');
    const config = new ConfigStore();
    expect(resolveLettaSettingsPath(config, 'embedded')).toBe(join(dir, 'letta', 'settings.json'));
    const applied = applyEmbeddedLettaSettingsEnv(config);
    expect(applied).toBe(join(dir, 'letta', 'settings.json'));
    expect(process.env.OTTO_LETTA_SETTINGS_PATH).toBe(applied);
    // The spawned Letta Code engine must read the isolated ~/.otto/letta state, not ~/.letta (#674).
    expect(process.env.LETTA_SETTINGS_PATH).toBe(applied);
    expect(process.env.LETTA_MEMORY_DIR).toBe(join(dir, 'letta', 'memory'));
    delete process.env.OTTO_HOME;
  });

  test('existing mode does not redirect the engine state env', () => {
    Reflect.deleteProperty(process.env, 'OTTO_LETTA_SETTINGS_PATH');
    Reflect.deleteProperty(process.env, 'LETTA_SETTINGS_PATH');
    Reflect.deleteProperty(process.env, 'LETTA_MEMORY_DIR');
    const dir = mkdtempSync(join(tmpdir(), 'otto-dream-existing-'));
    process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
    const config = new ConfigStore();
    config.update({ connectionMode: 'existing' });
    applyEmbeddedLettaSettingsEnv(config);
    expect(process.env.LETTA_SETTINGS_PATH).toBeUndefined();
    expect(process.env.LETTA_MEMORY_DIR).toBeUndefined();
  });
});
