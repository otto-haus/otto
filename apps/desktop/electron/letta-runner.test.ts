import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { discoverLocalLettaContext } from './letta-runner';

const envKeys = ['OTTO_CONFIG_DIR', 'OTTO_LETTA_SETTINGS_PATH', 'OTTO_SKIP_LETTA_LSOF', 'OTTO_AGENT_ID', 'LETTA_BASE_URL'] as const;
const originalEnv = new Map(envKeys.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

function isolatedConfig(settings: unknown): ConfigStore {
  const dir = mkdtempSync(join(tmpdir(), 'otto-config-'));
  const settingsPath = join(dir, 'letta-settings.json');
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  process.env.OTTO_AGENT_ID = '';
  process.env.LETTA_BASE_URL = '';
  process.env.OTTO_CONFIG_DIR = join(dir, 'otto');
  process.env.OTTO_LETTA_SETTINGS_PATH = settingsPath;
  process.env.OTTO_SKIP_LETTA_LSOF = '1';
  return new ConfigStore();
}

describe('discoverLocalLettaContext', () => {
  test('discovers local base URL and agent from Letta sessions when Otto config is empty', () => {
    const config = isolatedConfig({
      sessionsByServer: {
        '127.0.0.1:51087': {
          agentId: 'agent-local-discovered',
          conversationId: 'default',
        },
      },
    });

    expect(discoverLocalLettaContext(config)).toEqual({
      baseUrl: 'http://127.0.0.1:51087',
      agentId: 'agent-local-discovered',
      source: 'Letta local settings/discovery',
      reason: undefined,
    });
  });

  test('uses lastAgent as a local fallback when no session is present', () => {
    const config = isolatedConfig({ lastAgent: 'agent-local-last' });

    expect(discoverLocalLettaContext(config)).toMatchObject({
      agentId: 'agent-local-last',
      source: 'Letta local settings/discovery',
    });
  });

  test('Otto config overrides discovered Letta settings', () => {
    const config = isolatedConfig({
      sessionsByServer: {
        '127.0.0.1:51087': { agentId: 'agent-local-discovered' },
      },
    });
    config.update({ baseUrl: 'http://127.0.0.1:59999', agentId: 'agent-local-override' });

    expect(discoverLocalLettaContext(config)).toMatchObject({
      baseUrl: 'http://127.0.0.1:59999',
      agentId: 'agent-local-override',
      source: 'otto config/env',
    });
  });
});
