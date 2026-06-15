import { describe, expect, test } from 'bun:test';
import {
  evaluateReleaseMetadata,
  fetchRelease,
  normalizeTag,
  pickDesktopAsset,
  tagsMatch,
} from './lib/otto-release-metadata.mjs';

describe('otto-release-metadata', () => {
  test('pickDesktopAsset prefers desktop zip/dmg names', () => {
    const assets = [
      { name: 'otto-v01-desktop.mp4' },
      { name: 'otto-v01-desktop-mac.tar.gz' },
      { name: 'otto-v01-desktop-mac.zip' },
    ];
    expect(pickDesktopAsset(assets)?.name).toBe('otto-v01-desktop-mac.zip');
  });

  test('pickDesktopAsset ignores unsupported archive formats', () => {
    expect(pickDesktopAsset([{ name: 'otto-v01-desktop-mac.tar.gz' }])).toBeNull();
  });

  test('tagsMatch compares normalized tags', () => {
    expect(tagsMatch('v0.1.3', '0.1.3')).toBe(true);
    expect(tagsMatch('0.1.3+20260614', 'v0.1.3')).toBe(true);
    expect(tagsMatch('e453c2c', 'v0.1.3')).toBe(false);
    expect(tagsMatch('0.1', 'v0.1.3')).toBe(false);
    expect(tagsMatch('0.1.30', 'v0.1.3')).toBe(false);
    expect(normalizeTag('v0.1.3')).toBe('0.1.3');
  });

  test('evaluateReleaseMetadata passes when installed marker matches release tag', () => {
    const result = evaluateReleaseMetadata({
      release: {
        tag: 'v0.1.3',
        name: 'otto v0.1.3',
        publishedAt: '2026-06-14T00:00:00Z',
        assets: [{ name: 'otto-v01-desktop-mac.zip', url: 'https://example.com/a.zip' }],
      },
      installed: {
        installed: true,
        appPath: '/Applications/otto.app',
        releaseTag: null,
        version: '0.1.3',
        shortSha: '0.1.3',
        sha: null,
        builtAt: null,
        branch: null,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.checks.releaseTagMatchesInstalled).toBe(true);
  });

  test('evaluateReleaseMetadata prefers stamped release tag over build sha', () => {
    const result = evaluateReleaseMetadata({
      release: {
        tag: 'v0.1.3',
        name: 'otto v0.1.3',
        publishedAt: '2026-06-14T00:00:00Z',
        assets: [{ name: 'otto-v01-desktop-mac.zip', url: 'https://example.com/a.zip' }],
      },
      installed: {
        installed: true,
        appPath: '/Applications/otto.app',
        releaseTag: 'v0.1.3',
        version: '0.0.0',
        shortSha: 'e453c2c',
        sha: 'e453c2c6afba2d74559a265215f6f0bd987f0203',
        builtAt: null,
        branch: 'release/v0.1.3',
      },
    });
    expect(result.ok).toBe(true);
    expect(result.checks.releaseTagMatchesInstalled).toBe(true);
  });

  test('evaluateReleaseMetadata warns when desktop asset missing', () => {
    const result = evaluateReleaseMetadata({
      release: {
        tag: 'v0.1.3',
        assets: [{ name: 'otto-v01-desktop.mp4', url: 'https://example.com/x.mp4' }],
      },
      installed: { installed: false, appPath: '/Applications/otto.app' },
    });
    expect(result.checks.desktopAssetPublished).toBe(false);
    expect(result.warnings.some((w) => w.includes('no desktop'))).toBe(true);
    expect(result.ok).toBe(true);
  });

  test('fetchRelease uses tag endpoint when OTTO_RELEASE_TAG provided', async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          tag_name: 'v0.1.2',
          name: 'otto v0.1.2',
          published_at: '2026-06-13T00:00:00Z',
          assets: [{ name: 'otto-v01-desktop-mac.zip', browser_download_url: 'https://example.com/a.zip' }],
        }),
      };
    };
    const release = await fetchRelease({ tag: 'v0.1.2', repo: 'otto-haus/otto', fetchImpl });
    expect(release.tag).toBe('v0.1.2');
    expect(calls[0]).toContain('/releases/tags/v0.1.2');
  });

  test('evaluateReleaseMetadata supports rollback tag match (#324)', () => {
    const result = evaluateReleaseMetadata({
      release: {
        tag: 'v0.1.2',
        name: 'otto v0.1.2',
        publishedAt: '2026-06-13T00:00:00Z',
        assets: [{ name: 'otto-v01-desktop-mac.zip', url: 'https://example.com/a.zip' }],
      },
      installed: {
        installed: true,
        appPath: '/Applications/otto.app',
        releaseTag: 'v0.1.2',
        version: '0.1.2',
        shortSha: null,
        sha: null,
        builtAt: null,
        branch: 'release/v0.1.2',
      },
      requireInstalled: true,
    });
    expect(result.ok).toBe(true);
    expect(result.checks.releaseTagMatchesInstalled).toBe(true);
  });
});
