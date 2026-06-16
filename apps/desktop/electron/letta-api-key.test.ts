import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { hasLettaApiKey, readLettaApiKeyFromSettings, resolveLettaApiKey, syncLettaApiKeyEnv } from './letta-api-key';
import { setSecret } from './secret-store';

describe('letta-api-key', () => {
  const previousHome = process.env.OTTO_HOME;
  const previousApiKey = process.env.LETTA_API_KEY;

  afterEach(() => {
    if (previousHome === undefined) Reflect.deleteProperty(process.env, 'OTTO_HOME');
    else process.env.OTTO_HOME = previousHome;
    if (previousApiKey === undefined) Reflect.deleteProperty(process.env, 'LETTA_API_KEY');
    else process.env.LETTA_API_KEY = previousApiKey;
  });

  test('reads LETTA_API_KEY from Letta settings env block', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-letta-api-key-'));
    const settingsPath = join(dir, 'settings.json');
    writeFileSync(settingsPath, `${JSON.stringify({ env: { LETTA_API_KEY: 'settings-key' } })}\n`);
    expect(readLettaApiKeyFromSettings(settingsPath)).toBe('settings-key');
    rmSync(dir, { recursive: true, force: true });
  });

  test('prefers otto secrets.env over settings and inherited env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-letta-api-key-'));
    try {
      process.env.OTTO_HOME = dir;
      process.env.LETTA_API_KEY = 'inherited-key';
      mkdirSync(join(dir, 'letta'), { recursive: true });
      writeFileSync(join(dir, 'letta', 'settings.json'), `${JSON.stringify({ env: { LETTA_API_KEY: 'settings-key' } })}\n`);
      setSecret('LETTA_API_KEY', 'secret-key');
      const config = new ConfigStore();
      expect(resolveLettaApiKey(config)).toBe('secret-key');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('embedded mode resolves auth from ~/.otto/letta/settings.json env block', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-letta-api-key-'));
    try {
      process.env.OTTO_HOME = dir;
      Reflect.deleteProperty(process.env, 'LETTA_API_KEY');
      mkdirSync(join(dir, 'letta'), { recursive: true });
      writeFileSync(join(dir, 'letta', 'settings.json'), `${JSON.stringify({ env: { LETTA_API_KEY: 'embedded-settings-key' } })}\n`);
      const config = new ConfigStore();
      expect(config.connectionMode()).toBe('embedded');
      expect(resolveLettaApiKey(config)).toBe('embedded-settings-key');
      expect(syncLettaApiKeyEnv(config)).toBe(true);
      expect(process.env.LETTA_API_KEY).toBe('embedded-settings-key');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('preserves inherited process env when secrets and settings are empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-letta-api-key-'));
    try {
      process.env.OTTO_HOME = dir;
      process.env.LETTA_API_KEY = 'launchctl-key';
      mkdirSync(join(dir, 'letta'), { recursive: true });
      writeFileSync(join(dir, 'letta', 'settings.json'), '{}\n');
      const config = new ConfigStore();
      expect(resolveLettaApiKey(config)).toBe('launchctl-key');
      expect(syncLettaApiKeyEnv(config)).toBe(true);
      expect(process.env.LETTA_API_KEY).toBe('launchctl-key');
      expect(hasLettaApiKey(config)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
