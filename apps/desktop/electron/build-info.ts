import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppBuildInfo } from './shared/types';

const emptyBuildInfo = (): AppBuildInfo => ({
  sha: null,
  shortSha: null,
  builtAt: null,
  branch: null,
});

export function readAppBuildInfo(): AppBuildInfo {
  const fromEnv: AppBuildInfo = {
    sha: process.env.OTTO_BUILD_SHA?.trim() || null,
    shortSha: process.env.OTTO_BUILD_SHORT_SHA?.trim() || null,
    builtAt: process.env.OTTO_BUILD_TIME?.trim() || null,
    branch: process.env.OTTO_BUILD_BRANCH?.trim() || null,
  };
  if (fromEnv.sha || fromEnv.shortSha) return fromEnv;

  try {
    const path = join(process.resourcesPath, 'app', 'build-info.json');
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppBuildInfo>;
    return {
      sha: typeof parsed.sha === 'string' ? parsed.sha : null,
      shortSha: typeof parsed.shortSha === 'string' ? parsed.shortSha : null,
      builtAt: typeof parsed.builtAt === 'string' ? parsed.builtAt : null,
      branch: typeof parsed.branch === 'string' ? parsed.branch : null,
    };
  } catch {
    return emptyBuildInfo();
  }
}
