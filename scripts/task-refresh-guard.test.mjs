import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('task refresh guard (#303)', () => {
  test('task refresh is blocked and points to install:release or staging', () => {
    const result = spawnSync('task', ['refresh'], {
      cwd: root,
      encoding: 'utf8',
      shell: false,
    });

    expect(result.status).not.toBe(0);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain('install:release');
    expect(output).toContain('task staging');
    expect(output).not.toContain('Refreshed /Applications/otto.app');
  });
});
