import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('check-ship-tier-matrix', () => {
  test('matrix matches SURFACE_TIER and LabFeatureId registries', () => {
    const result = spawnSync('bun', ['scripts/check-ship-tier-matrix.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      throw new Error(result.stdout + result.stderr);
    }
    expect(result.stdout).toContain('ship-tier-matrix OK');
  });
});
