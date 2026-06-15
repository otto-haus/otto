import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = join(import.meta.dir, '../build');

describe('staging app icon assets (#292)', () => {
  test('icon-staging.icns exists and differs from production icon.icns', () => {
    const production = join(BUILD_DIR, 'icon.icns');
    const staging = join(BUILD_DIR, 'icon-staging.icns');
    const productionBytes = readFileSync(production);
    const stagingBytes = readFileSync(staging);
    expect(productionBytes.length).toBeGreaterThan(0);
    expect(stagingBytes.length).toBeGreaterThan(0);
    expect(stagingBytes.equals(productionBytes)).toBe(false);
  });

  test('icon-staging.meta.json documents the treatment', () => {
    const meta = JSON.parse(readFileSync(join(BUILD_DIR, 'icon-staging.meta.json'), 'utf8'));
    expect(meta.treatment).toContain('amber');
    expect(meta.outputs).toContain('icon-staging.icns');
  });
});
