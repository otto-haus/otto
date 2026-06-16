import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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

  test('lettaConnected reflects live readiness, not a configured-but-offline URL (#650)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-provider-probe-'));
    try {
      process.env.OTTO_HOME = tmp;
      const config = new ConfigStore();
      config.update({ agentId: 'agent-1', baseUrl: 'http://127.0.0.1:8283' });

      const offline = buildProviderMirror(config, false);
      expect(offline.lettaConnected).toBe(false);
      expect(offline.lettaConfigured).toBe(true);

      const live = buildProviderMirror(config, true);
      expect(live.lettaConnected).toBe(true);
      expect(live.lettaConfigured).toBe(true);
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
      expect(statSync(secretStorePath()).mode & 0o777).toBe(0o600);

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

  test('renderer and IPC sources do not log submitted key material', () => {
    const desktopRoot = resolve(import.meta.dir, '..');
    const sources = [
      join(desktopRoot, 'src/surfaces/Panes.tsx'),
      join(desktopRoot, 'electron/ipc.ts'),
      join(desktopRoot, 'electron/preload.ts'),
      join(desktopRoot, 'electron/image-gen.ts'),
    ];
    const blocked = [
      /console\.(log|debug|info|warn|error)\([^)]*apiKeyDraft/,
      /console\.(log|debug|info|warn|error)\([^)]*set-api-key[^)]*value/,
      /console\.(log|debug|info|warn|error)\([^)]*LETTA_API_KEY[^)]*value/,
    ];
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of blocked) {
        expect(text).not.toMatch(pattern);
      }
    }
  });
});
