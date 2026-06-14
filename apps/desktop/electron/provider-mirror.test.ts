import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { buildProviderMirror } from './provider-mirror';

describe('buildProviderMirror', () => {
  test('returns boolean presence only — no key material', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-provider-test-'));
    try {
      process.env.OTTO_HOME = tmp;
      const config = new ConfigStore();
      config.update({ agentId: 'agent-1', baseUrl: 'http://127.0.0.1:8283' });
      const mirror = buildProviderMirror(config, false);
      expect(typeof mirror.hasApiKey).toBe('boolean');
      expect(mirror.note).toContain('never stores or reads back');
      const serialized = JSON.stringify(mirror);
      expect(serialized).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
      expect(serialized).not.toContain('apiKey');
      expect(serialized).not.toContain('secret');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
