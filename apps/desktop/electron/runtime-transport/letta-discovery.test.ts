import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from '../config-store';
import { discoverLocalLettaContext, resolveModelHandle } from './letta-discovery';
import type { LettaModelOption } from '../shared/types';

const envKeys = ['OTTO_HOME', 'OTTO_LETTA_SETTINGS_PATH', 'OTTO_SKIP_LETTA_LSOF'] as const;
const originalEnv = new Map(envKeys.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

describe('discoverLocalLettaContext embedded state', () => {
  test('uses OTTO_HOME/letta settings without host ~/.letta bleed', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-letta-discovery-'));
    try {
      process.env.OTTO_HOME = tmp;
      process.env.OTTO_SKIP_LETTA_LSOF = '1';
      Reflect.deleteProperty(process.env, 'OTTO_LETTA_SETTINGS_PATH');
      const settingsPath = join(tmp, 'letta', 'settings.json');
      mkdirSync(join(tmp, 'letta'), { recursive: true });
      writeFileSync(settingsPath, `${JSON.stringify({ lastAgent: 'agent-embedded-076' }, null, 2)}\n`, 'utf8');
      const config = new ConfigStore();
      config.update({ connectionMode: 'embedded' });
      const context = discoverLocalLettaContext(config);
      expect(context.agentCandidates).toContain('agent-embedded-076');
      expect(process.env.OTTO_LETTA_SETTINGS_PATH).toBe(settingsPath);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

const MODELS: LettaModelOption[] = [
  { handle: 'letta/auto', label: 'Auto' },
  { handle: 'openai/gpt-5.5', label: 'GPT 5.5' },
  { handle: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
];

describe('resolveModelHandle', () => {
  test('keeps requested handle when present in discovered models', () => {
    const resolved = resolveModelHandle('anthropic/claude-opus-4-8', MODELS);
    expect(resolved).toEqual({
      requested: 'anthropic/claude-opus-4-8',
      active: 'anthropic/claude-opus-4-8',
      fallbackReason: null,
    });
  });

  test('does not mutate requested when absent from discovery — falls back for active only', () => {
    const resolved = resolveModelHandle('anthropic/claude-sonnet-4', MODELS);
    expect(resolved.requested).toBe('anthropic/claude-sonnet-4');
    expect(resolved.active).toBe('letta/auto');
    expect(resolved.fallbackReason).toContain('anthropic/claude-sonnet-4');
    expect(resolved.fallbackReason).toContain('letta/auto');
  });

  test('returns null active when no models and no preference', () => {
    expect(resolveModelHandle(null, [])).toEqual({
      requested: null,
      active: null,
      fallbackReason: null,
    });
  });

  test('uses default chain when preference is null', () => {
    const resolved = resolveModelHandle(null, MODELS);
    expect(resolved).toEqual({
      requested: null,
      active: 'letta/auto',
      fallbackReason: null,
    });
  });
});
