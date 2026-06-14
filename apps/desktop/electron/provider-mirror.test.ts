import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { buildProviderMirror } from './provider-mirror';
import { hasSecret, secretStorePath, setSecret } from './secret-store';

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

  test('audits provider traces without leaking an isolated submitted key', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-provider-audit-'));
    const submittedKey = 'providerMirrorAuditFakeSecret0123456789';
    try {
      process.env.OTTO_HOME = tmp;
      expect(secretStorePath()).toBe(join(tmp, 'secrets.env'));
      setSecret('LETTA_API_KEY', submittedKey);
      const config = new ConfigStore();
      config.update({ agentId: 'agent-1', baseUrl: 'http://127.0.0.1:8283', modelHandle: 'openai/gpt-4.1' });

      const mirror = buildProviderMirror(config, false);
      expect(mirror.hasApiKey).toBe(true);
      expect(hasSecret('LETTA_API_KEY')).toBe(true);
      expect(readFileSync(secretStorePath(), 'utf8')).toContain(submittedKey);

      const configDump = readFileSync(join(tmp, 'config.json'), 'utf8');
      const ipcTrace = JSON.stringify({
        mirror,
        setApiKeyResponse: { ok: true, hasApiKey: mirror.hasApiKey },
      });

      expect(configDump).not.toContain(submittedKey);
      expect(ipcTrace).not.toContain(submittedKey);
      expect(ipcTrace).not.toContain('LETTA_API_KEY');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
