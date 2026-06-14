/**
 * Shared helpers for #305 — compare installed /Applications/otto.app metadata to GitHub Release.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export const DEFAULT_REPO = 'otto-haus/otto';
export const DEFAULT_APP = '/Applications/otto.app';

const DESKTOP_ASSET_RE =
  /(?:^|\/)(?:otto[-_.]?)?(?:v?\d[\w.-]*)?(?:desktop|mac)(?:[-_.][\w.-]+)?\.(?:zip|dmg)$/i;

export function pickDesktopAsset(assets = []) {
  for (const asset of assets) {
    const name = asset?.name ?? '';
    if (DESKTOP_ASSET_RE.test(name)) return asset;
  }
  return null;
}

export function normalizeTag(tag) {
  if (!tag || typeof tag !== 'string') return null;
  return tag.trim().replace(/^v/i, '');
}

export function tagsMatch(installed, releaseTag) {
  const a = normalizeTag(installed);
  const b = normalizeTag(releaseTag);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  return false;
}

export async function fetchLatestRelease(repo = DEFAULT_REPO, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'otto-release-metadata-check' },
  });
  if (!res.ok) {
    throw new Error(`GitHub releases/latest failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    tag: data.tag_name ?? null,
    name: data.name ?? null,
    publishedAt: data.published_at ?? null,
    assets: Array.isArray(data.assets) ? data.assets.map((a) => ({ name: a.name, url: a.browser_download_url })) : [],
  };
}

function readPlistEnv(plistPath, key) {
  try {
    return execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :LSEnvironment:${key}`, plistPath], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

export function readInstalledMetadata(appPath = DEFAULT_APP) {
  const plistPath = `${appPath}/Contents/Info.plist`;
  if (!existsSync(plistPath)) {
    return { installed: false, appPath, shortSha: null, sha: null, version: null, builtAt: null, branch: null };
  }

  let version = null;
  try {
    version = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', plistPath], {
      encoding: 'utf8',
    }).trim();
  } catch {
    version = null;
  }

  let shortSha = readPlistEnv(plistPath, 'OTTO_BUILD_SHORT_SHA');
  let sha = readPlistEnv(plistPath, 'OTTO_BUILD_SHA');
  let builtAt = readPlistEnv(plistPath, 'OTTO_BUILD_TIME');
  let branch = readPlistEnv(plistPath, 'OTTO_BUILD_BRANCH');

  const buildInfoPath = `${appPath}/Contents/Resources/app/build-info.json`;
  if (existsSync(buildInfoPath)) {
    try {
      const parsed = JSON.parse(readFileSync(buildInfoPath, 'utf8'));
      shortSha = shortSha || parsed.shortSha || null;
      sha = sha || parsed.sha || null;
      builtAt = builtAt || parsed.builtAt || null;
      branch = branch || parsed.branch || null;
    } catch {
      /* ignore */
    }
  }

  return {
    installed: true,
    appPath,
    version,
    shortSha,
    sha,
    builtAt,
    branch,
  };
}

export function evaluateReleaseMetadata({ release, installed, requireInstalled = false }) {
  const desktopAsset = pickDesktopAsset(release.assets);
  const checks = {
    latestReleaseFetched: !!release.tag,
    desktopAssetPublished: !!desktopAsset,
    appInstalled: installed.installed,
    releaseTagMatchesInstalled: false,
    buildMarkerPresent: !!(installed.shortSha || installed.version),
  };

  if (installed.installed) {
    const marker = installed.shortSha || installed.version;
    checks.releaseTagMatchesInstalled = tagsMatch(marker, release.tag);
  }

  const warnings = [];
  if (!desktopAsset) {
    warnings.push(
      'Latest GitHub Release has no desktop .app artifact yet (release-only install path is defined but blocked until publish).',
    );
  }
  if (requireInstalled && !installed.installed) {
    warnings.push(`Live app not found at ${installed.appPath}`);
  }
  if (installed.installed && !checks.releaseTagMatchesInstalled && checks.buildMarkerPresent) {
    warnings.push(`Installed app marker does not match latest release tag ${release.tag}.`);
  }
  if (installed.installed && !checks.buildMarkerPresent) {
    warnings.push('Installed app has no OTTO build marker or version to compare against release tag.');
  }

  const ok =
    checks.latestReleaseFetched &&
    (!requireInstalled || checks.appInstalled) &&
    (!installed.installed || !checks.buildMarkerPresent || checks.releaseTagMatchesInstalled);

  return {
    ok,
    checks,
    warnings,
    release,
    installed,
    desktopAsset: desktopAsset?.name ?? null,
  };
}
