import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('readAppBuildInfo', () => {
  test('prefers OTTO_BUILD_* and source env vars', async () => {
    const prev = {
      OTTO_BUILD_SHA: process.env.OTTO_BUILD_SHA,
      OTTO_BUILD_SHORT_SHA: process.env.OTTO_BUILD_SHORT_SHA,
      OTTO_BUILD_TIME: process.env.OTTO_BUILD_TIME,
      OTTO_BUILD_BRANCH: process.env.OTTO_BUILD_BRANCH,
      OTTO_APP_CHANNEL: process.env.OTTO_APP_CHANNEL,
      OTTO_APP_VERSION: process.env.OTTO_APP_VERSION,
      OTTO_APP_PATH: process.env.OTTO_APP_PATH,
      OTTO_PROFILE_PATH: process.env.OTTO_PROFILE_PATH,
      OTTO_HOME: process.env.OTTO_HOME,
      OTTO_MAIN_SHA: process.env.OTTO_MAIN_SHA,
      OTTO_MAIN_SHORT_SHA: process.env.OTTO_MAIN_SHORT_SHA,
    };
    process.env.OTTO_BUILD_SHA = 'abc123full';
    process.env.OTTO_BUILD_SHORT_SHA = 'abc123';
    process.env.OTTO_BUILD_TIME = '2026-06-14T12:00:00Z';
    process.env.OTTO_BUILD_BRANCH = 'fix/314-staging-release-candidate';
    process.env.OTTO_APP_CHANNEL = 'staging';
    process.env.OTTO_APP_VERSION = '0.1.3';
    process.env.OTTO_APP_PATH = '/Applications/otto-staging.app';
    process.env.OTTO_PROFILE_PATH = '/tmp/profile';
    process.env.OTTO_HOME = '/tmp/otto-home';
    process.env.OTTO_MAIN_SHA = 'abc123full';
    process.env.OTTO_MAIN_SHORT_SHA = 'abc123';
    const mod = await import('./build-info');
    expect(mod.readAppBuildInfo()).toEqual({
      sha: 'abc123full',
      shortSha: 'abc123',
      builtAt: '2026-06-14T12:00:00Z',
      branch: 'fix/314-staging-release-candidate',
      channel: 'staging',
      version: '0.1.3',
      appPath: '/Applications/otto-staging.app',
      profilePath: '/tmp/profile',
      homePath: '/tmp/otto-home',
      mainSha: 'abc123full',
      mainShortSha: 'abc123',
      matchesMain: true,
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
      JSON.stringify({
        sha: 'deadbeef',
        shortSha: 'deadbee',
        builtAt: '2026-06-14T12:00:00Z',
        branch: 'main',
        channel: 'staging',
        version: '0.1.3',
        appPath: '/Applications/otto-staging.app',
        profilePath: '/tmp/profile',
        homePath: '/tmp/home',
        mainSha: 'cafebabe',
        mainShortSha: 'cafebab',
      }),
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
      OTTO_APP_CHANNEL: process.env.OTTO_APP_CHANNEL,
    };
    delete process.env.OTTO_BUILD_SHA;
    delete process.env.OTTO_BUILD_SHORT_SHA;
    delete process.env.OTTO_BUILD_TIME;
    delete process.env.OTTO_BUILD_BRANCH;
    delete process.env.OTTO_APP_CHANNEL;
    const mod = await import('./build-info');
    expect(mod.readAppBuildInfo()).toEqual({
      sha: 'deadbeef',
      shortSha: 'deadbee',
      builtAt: '2026-06-14T12:00:00Z',
      branch: 'main',
      channel: 'staging',
      version: '0.1.3',
      appPath: '/Applications/otto-staging.app',
      profilePath: '/tmp/profile',
      homePath: '/tmp/home',
      mainSha: 'cafebabe',
      mainShortSha: 'cafebab',
      matchesMain: false,
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
