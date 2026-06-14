import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppBuildInfo, AppChannel } from './shared/types';

const emptyBuildInfo = (): AppBuildInfo => ({
  sha: null,
  shortSha: null,
  builtAt: null,
  branch: null,
  channel: null,
  version: null,
  appPath: null,
  profilePath: null,
  homePath: null,
  mainSha: null,
  mainShortSha: null,
  matchesMain: null,
});

const pickChannel = (raw: string | undefined): AppChannel | null => {
  if (raw === 'release' || raw === 'staging' || raw === 'dev' || raw === 'disposable') return raw;
  return null;
};

const normalize = (partial: Partial<AppBuildInfo>): AppBuildInfo => {
  const sha = partial.sha ?? null;
  const mainSha = partial.mainSha ?? null;
  return {
    sha,
    shortSha: partial.shortSha ?? null,
    builtAt: partial.builtAt ?? null,
    branch: partial.branch ?? null,
    channel: partial.channel ?? null,
    version: partial.version ?? null,
    appPath: partial.appPath ?? null,
    profilePath: partial.profilePath ?? null,
    homePath: partial.homePath ?? null,
    mainSha,
    mainShortSha: partial.mainShortSha ?? null,
    matchesMain: sha && mainSha ? sha === mainSha : null,
  };
};

const fromEnv = (): Partial<AppBuildInfo> => ({
  sha: process.env.OTTO_BUILD_SHA?.trim() || null,
  shortSha: process.env.OTTO_BUILD_SHORT_SHA?.trim() || null,
  builtAt: process.env.OTTO_BUILD_TIME?.trim() || null,
  branch: process.env.OTTO_BUILD_BRANCH?.trim() || null,
  channel: pickChannel(process.env.OTTO_APP_CHANNEL?.trim()),
  version: process.env.OTTO_APP_VERSION?.trim() || null,
  appPath: process.env.OTTO_APP_PATH?.trim() || null,
  profilePath: process.env.OTTO_PROFILE_PATH?.trim() || null,
  homePath: process.env.OTTO_HOME?.trim() || process.env.HOME?.trim() || null,
  mainSha: process.env.OTTO_MAIN_SHA?.trim() || null,
  mainShortSha: process.env.OTTO_MAIN_SHORT_SHA?.trim() || null,
});

export function readAppBuildInfo(): AppBuildInfo {
  const env = fromEnv();
  if (env.sha || env.shortSha) return normalize(env);

  try {
    const path = join(process.resourcesPath, 'app', 'build-info.json');
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppBuildInfo>;
    return normalize({
      sha: typeof parsed.sha === 'string' ? parsed.sha : null,
      shortSha: typeof parsed.shortSha === 'string' ? parsed.shortSha : null,
      builtAt: typeof parsed.builtAt === 'string' ? parsed.builtAt : null,
      branch: typeof parsed.branch === 'string' ? parsed.branch : null,
      channel: pickChannel(typeof parsed.channel === 'string' ? parsed.channel : undefined),
      version: typeof parsed.version === 'string' ? parsed.version : null,
      appPath: typeof parsed.appPath === 'string' ? parsed.appPath : null,
      profilePath: typeof parsed.profilePath === 'string' ? parsed.profilePath : null,
      homePath: typeof parsed.homePath === 'string' ? parsed.homePath : null,
      mainSha: typeof parsed.mainSha === 'string' ? parsed.mainSha : null,
      mainShortSha: typeof parsed.mainShortSha === 'string' ? parsed.mainShortSha : null,
    });
  } catch {
    return emptyBuildInfo();
  }
}
