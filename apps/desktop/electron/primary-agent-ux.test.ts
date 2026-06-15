import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('primary agent default UX (#119 / ADR 093)', () => {
  test('onboarding copy explains one primary agent per workspace', async () => {
    const { onboardingCopy } = await import('../src/copy/surfaces');
    expect(onboardingCopy.modeLede.toLowerCase()).toContain('one primary agent');
    expect(onboardingCopy.connectLede.toLowerCase()).toContain('one primary agent');
  });

  test('settings advanced flow exposes isolated agent create (#120)', async () => {
    const { settingsCopy, isolatedAgentBoundaryOptions } = await import('../src/copy/surfaces');
    expect(settingsCopy.isolatedAgentCreate.toLowerCase()).toContain('isolated');
    expect(isolatedAgentBoundaryOptions.length).toBe(6);
    expect(settingsCopy.primaryAgentOpenLetta).toBe('Open in Letta');
  });

  test('main shell copy avoids v1 fleet patterns', () => {
    const surfaces = readFileSync(join(import.meta.dir, '../src/copy/surfaces.ts'), 'utf8');
    const panes = readFileSync(join(import.meta.dir, '../src/surfaces/Panes.tsx'), 'utf8');
    const forbidden = ['add agent', 'agent fleet', 'switch agent'];
    for (const src of [surfaces, panes]) {
      for (const token of forbidden) {
        expect(src.toLowerCase().includes(token)).toBe(false);
      }
    }
  });

  test('runtime transport doc cross-links ADR 093 and primaryAgentId', () => {
    const doc = readFileSync(join(import.meta.dir, '../../../docs/runtime-transport.md'), 'utf8');
    expect(doc).toContain('093-multi-agent-workspace-policy');
    expect(doc).toContain('primaryAgentId');
  });

  test('transports persist primaryAgentId on connect', () => {
    const sdk = readFileSync(join(import.meta.dir, 'runtime-transport/sdk-subprocess-transport.ts'), 'utf8');
    const ws = readFileSync(join(import.meta.dir, 'runtime-transport/ws-runtime-transport.ts'), 'utf8');
    expect(sdk.includes('ensurePrimaryAgentId')).toBe(true);
    expect(ws.includes('ensurePrimaryAgentId')).toBe(true);
  });
});

describe('isolated second agent (#120)', () => {
  test('agent candidates prefer primaryAgentId for Chat default', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const tmp = mkdtempSync(join(tmpdir(), 'otto-config-primary-'));
    process.env.OTTO_CONFIG_DIR = tmp;
    const { ConfigStore } = await import('./config-store');
    const store = new ConfigStore();
    store.update({ primaryAgentId: 'agent-primary', agentId: 'agent-legacy' });
    expect(store.agentCandidates()[0]).toBe('agent-primary');
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.OTTO_CONFIG_DIR;
  });
});
