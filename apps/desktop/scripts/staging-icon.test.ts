import { describe, expect, test } from 'bun:test';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = join(import.meta.dir, '../build');

describe('staging app icon assets (#292)', () => {
  test('icon-staging.icns exists and differs from production icon.icns', () => {
    const production = join(BUILD_DIR, 'icon.icns');
    const staging = join(BUILD_DIR, 'icon-staging.icns');
    expect(statSync(production).size).toBeGreaterThan(0);
    expect(statSync(staging).size).toBeGreaterThan(0);
    expect(readFileSync(staging).equals(readFileSync(production))).toBe(false);
  });

  test('icon-staging.meta.json documents the treatment', () => {
    const meta = JSON.parse(readFileSync(join(BUILD_DIR, 'icon-staging.meta.json'), 'utf8'));
    expect(meta.treatment).toContain('amber');
    expect(meta.outputs).toContain('icon-staging.icns');
  });
});
