import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskfile = fs.readFileSync(path.join(root, 'Taskfile.yml'), 'utf8');

describe('canonical app refresh guard (#303)', () => {
  test('Taskfile blocks task refresh from installing local builds into otto.app', () => {
    expect(taskfile).toContain('refresh:\n    desc: BLOCKED');
    expect(taskfile).toContain('task refresh no longer installs local branch builds into /Applications/otto.app');
    expect(taskfile).toContain('OTTO_ALLOW_RELEASE_INSTALL=1 task install:release');
    expect(taskfile).toContain('task staging');
    expect(taskfile).toContain('_refresh-live:');
    expect(taskfile).toContain('OTTO_ALLOW_LOCAL_LIVE_BUILD');
  });

  test('refresh-otto-app.sh refuses without OTTO_ALLOW_LIVE_REFRESH', () => {
    const result = spawnSync('bash', ['scripts/refresh-otto-app.sh'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        OTTO_ALLOW_LIVE_REFRESH: '',
        OTTO_ALLOW_LOCAL_LIVE_BUILD: '',
      },
    });

    expect(result.status).toBe(2);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain('install:release');
    expect(output).toContain('task staging');
  });

  test('refresh-otto-app.sh refuses local branch build without OTTO_ALLOW_LOCAL_LIVE_BUILD', () => {
    const result = spawnSync('bash', ['scripts/refresh-otto-app.sh'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        OTTO_ALLOW_LIVE_REFRESH: '1',
        OTTO_ALLOW_LOCAL_LIVE_BUILD: '',
      },
    });

    expect(result.status).toBe(2);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain('Refusing local branch build into /Applications/otto.app');
    expect(output).toContain('install:release');
  });
});
