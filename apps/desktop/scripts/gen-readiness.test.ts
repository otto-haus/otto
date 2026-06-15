import { describe, expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(scriptDir, 'gen-readiness.mjs');
const repoRoot = resolve(scriptDir, '../../..');

type ReadinessOutput = {
  configSource: string | null;
  items: Array<{ key: string; status: string; detail: string; source?: string | null }>;
};

function runGenerator(env: Record<string, string | undefined>, outputPath: string): ReadinessOutput {
  execFileSync('node', [scriptPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      OTTO_READINESS_INCLUDE_LOCAL_CONFIG: '',
      OTTO_READINESS_IGNORE_LOCAL_CONFIG: '',
      ...env,
      OTTO_READINESS_OUTPUT_PATH: outputPath,
    },
    stdio: 'pipe',
  });
  return JSON.parse(readFileSync(outputPath, 'utf8')) as ReadinessOutput;
}

describe('gen-readiness', () => {
  test('defaults to committed preview baseline even when local config exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-readiness-'));
    try {
      const configPath = join(tmp, 'config.json');
      const outputPath = join(tmp, 'readiness.json');
      writeFileSync(configPath, JSON.stringify({ agentId: 'agent-local-test', runtime: { connected: true } }));

      const readiness = runGenerator({ OTTO_READINESS_CONFIG_PATH: configPath }, outputPath);
      const agent = readiness.items.find((item) => item.key === 'agent');

      expect(readiness.configSource).toBeNull();
      expect(agent?.status).toBe('missing');
      expect(JSON.stringify(readiness)).not.toContain('agent-local-test');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('reads local config only with explicit opt in', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-readiness-'));
    try {
      const configPath = join(tmp, 'config.json');
      const outputPath = join(tmp, 'readiness.json');
      writeFileSync(configPath, JSON.stringify({ agentId: 'agent-local-test', runtime: { connected: true } }));

      const readiness = runGenerator(
        {
          OTTO_READINESS_CONFIG_PATH: configPath,
          OTTO_READINESS_INCLUDE_LOCAL_CONFIG: '1',
        },
        outputPath,
      );
      const agent = readiness.items.find((item) => item.key === 'agent');

      expect(readiness.configSource).toBe('local readiness config');
      expect(agent?.status).toBe('configured');
      expect(agent?.detail).toBe('agent agent-local-test');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('OTTO_READINESS_IGNORE_LOCAL_CONFIG blocks opt-in diagnostic render', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-readiness-'));
    try {
      const configPath = join(tmp, 'config.json');
      const outputPath = join(tmp, 'readiness.json');
      writeFileSync(configPath, JSON.stringify({ agentId: 'agent-local-test', runtime: { connected: true } }));

      const readiness = runGenerator(
        {
          OTTO_READINESS_CONFIG_PATH: configPath,
          OTTO_READINESS_INCLUDE_LOCAL_CONFIG: '1',
          OTTO_READINESS_IGNORE_LOCAL_CONFIG: '1',
        },
        outputPath,
      );
      const agent = readiness.items.find((item) => item.key === 'agent');

      expect(readiness.configSource).toBeNull();
      expect(agent?.status).toBe('missing');
      expect(JSON.stringify(readiness)).not.toContain('agent-local-test');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
