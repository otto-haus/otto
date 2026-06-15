import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore } from './config-store';
import { ThreadStore } from './thread-store';
import { readWorkspaceContext } from './workspace-context';

describe('readWorkspaceContext', () => {
  test('returns project root and otto home paths', () => {
    const prevHome = process.env.OTTO_HOME;
    const prevRoot = process.env.OTTO_ROOT;
    const dir = mkdtempSync(join(tmpdir(), 'otto-ws-'));
    try {
      process.env.OTTO_HOME = dir;
      process.env.OTTO_ROOT = join(dir, 'repo');
      const config = new ConfigStore();
      const threads = new ThreadStore(config);
      const ctx = readWorkspaceContext(config, threads, {
        ready: true,
        agentId: 'agent-1',
        conversationId: 'conv-1',
        transportMode: 'auto',
        effectiveTransport: 'sdk subprocess',
        model: 'test-model',
        cliPath: '',
        cliResolved: true,
      });
      expect(ctx.projectRoot).toBe(join(dir, 'repo'));
      expect(ctx.ottoHome).toBe(dir);
      expect(ctx.projectSwitch.allowed).toBe(false);
      expect(ctx.runtime?.agentId).toBe('agent-1');
    } finally {
      if (prevHome === undefined) delete process.env.OTTO_HOME;
      else process.env.OTTO_HOME = prevHome;
      if (prevRoot === undefined) delete process.env.OTTO_ROOT;
      else process.env.OTTO_ROOT = prevRoot;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
