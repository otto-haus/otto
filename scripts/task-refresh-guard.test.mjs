import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import fs, { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

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

describe('staging latest-main refresh (#338)', () => {
  test('Taskfile documents staging:main refresh path', () => {
    expect(taskfile).toContain('staging:main:');
    expect(taskfile).toContain('scripts/staging-refresh-from-main.sh');
    expect(taskfile).toContain('staging:build:');
  });

  test('staging-refresh-from-main.sh refuses when HEAD is not origin/main', () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'otto-staging-refresh-'));
    const bareOrigin = path.join(fixture, 'origin.git');
    const scriptsDir = path.join(fixture, 'scripts');
    const appsDesktopScripts = path.join(fixture, 'apps', 'desktop', 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(appsDesktopScripts, { recursive: true });
    fs.copyFileSync(
      path.join(root, 'scripts/staging-refresh-from-main.sh'),
      path.join(scriptsDir, 'staging-refresh-from-main.sh'),
    );
    fs.writeFileSync(
      path.join(appsDesktopScripts, 'deploy-staging.sh'),
      'echo deploy-staging-stub',
      'utf8',
    );

    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@test.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@test.com',
    };

    spawnSync('git', ['init', '--bare', bareOrigin], { cwd: fixture, encoding: 'utf8' });
    spawnSync('git', ['init'], { cwd: fixture, encoding: 'utf8' });
    spawnSync('git', ['remote', 'add', 'origin', bareOrigin], { cwd: fixture, encoding: 'utf8', env: gitEnv });
    spawnSync('git', ['commit', '--allow-empty', '-m', 'main-tip'], {
      cwd: fixture,
      encoding: 'utf8',
      env: gitEnv,
    });
    spawnSync('git', ['branch', '-M', 'main'], { cwd: fixture, encoding: 'utf8', env: gitEnv });
    spawnSync('git', ['push', '-u', 'origin', 'main'], { cwd: fixture, encoding: 'utf8', env: gitEnv });
    spawnSync('git', ['commit', '--allow-empty', '-m', 'ahead-of-main'], {
      cwd: fixture,
      encoding: 'utf8',
      env: gitEnv,
    });

    const result = spawnSync('bash', ['scripts/staging-refresh-from-main.sh'], {
      cwd: fixture,
      encoding: 'utf8',
      env: gitEnv,
    });

    expect(result.status).toBe(1);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain('Refusing staging:main');
    expect(output).not.toContain('deploy-staging-stub');
  });

  test('staging-refresh-from-main.sh delegates to deploy-staging, not live app path', () => {
    const script = fs.readFileSync(path.join(root, 'scripts/staging-refresh-from-main.sh'), 'utf8');
    expect(script).toContain('Never touches /Applications/otto.app');
    expect(script).toContain('exec bash "$ROOT/apps/desktop/scripts/deploy-staging.sh"');
    expect(script).not.toContain('otto.app"');
  });
});
