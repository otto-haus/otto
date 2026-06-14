import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('readAppBuildInfo', () => {
  test('prefers OTTO_BUILD_* env vars', async () => {
    const prev = {
      OTTO_BUILD_SHA: process.env.OTTO_BUILD_SHA,
      OTTO_BUILD_SHORT_SHA: process.env.OTTO_BUILD_SHORT_SHA,
      OTTO_BUILD_TIME: process.env.OTTO_BUILD_TIME,
      OTTO_BUILD_BRANCH: process.env.OTTO_BUILD_BRANCH,
    };
    process.env.OTTO_BUILD_SHA = 'abc123full';
    process.env.OTTO_BUILD_SHORT_SHA = 'abc123';
    process.env.OTTO_BUILD_TIME = '2026-06-14T12:00:00Z';
    process.env.OTTO_BUILD_BRANCH = 'fix/314-staging-release-candidate';
    const mod = await import('./build-info');
    expect(mod.readAppBuildInfo()).toEqual({
      sha: 'abc123full',
      shortSha: 'abc123',
      builtAt: '2026-06-14T12:00:00Z',
      branch: 'fix/314-staging-release-candidate',
    });
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test('reads build-info.json from resources when env is absent', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-build-info-'));
    const appDir = join(dir, 'app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(
      join(appDir, 'build-info.json'),
      JSON.stringify({ sha: 'deadbeef', shortSha: 'deadbee', builtAt: '2026-06-14T12:00:00Z', branch: 'main' }),
    );
    const originalResourcesPath = process.resourcesPath;
    const hadResourcesPath = Object.prototype.hasOwnProperty.call(process, 'resourcesPath');
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      writable: true,
      value: dir,
    });
    const prevEnv = {
      OTTO_BUILD_SHA: process.env.OTTO_BUILD_SHA,
      OTTO_BUILD_SHORT_SHA: process.env.OTTO_BUILD_SHORT_SHA,
      OTTO_BUILD_TIME: process.env.OTTO_BUILD_TIME,
      OTTO_BUILD_BRANCH: process.env.OTTO_BUILD_BRANCH,
    };
    delete process.env.OTTO_BUILD_SHA;
    delete process.env.OTTO_BUILD_SHORT_SHA;
    delete process.env.OTTO_BUILD_TIME;
    delete process.env.OTTO_BUILD_BRANCH;
    const mod = await import('./build-info');
    expect(mod.readAppBuildInfo()).toEqual({
      sha: 'deadbeef',
      shortSha: 'deadbee',
      builtAt: '2026-06-14T12:00:00Z',
      branch: 'main',
    });
    if (hadResourcesPath) {
      Object.defineProperty(process, 'resourcesPath', {
        configurable: true,
        writable: true,
        value: originalResourcesPath,
      });
    } else {
      delete (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    }
    for (const [key, value] of Object.entries(prevEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
});
