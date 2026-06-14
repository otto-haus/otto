import { describe, expect, test } from 'bun:test';
import {
  evaluateReleaseMetadata,
  normalizeTag,
  pickDesktopAsset,
  tagsMatch,
} from './lib/otto-release-metadata.mjs';

describe('otto-release-metadata', () => {
  test('pickDesktopAsset prefers desktop zip/dmg names', () => {
    const assets = [
      { name: 'otto-v01-desktop.mp4' },
      { name: 'otto-v01-desktop-mac.zip' },
    ];
    expect(pickDesktopAsset(assets)?.name).toBe('otto-v01-desktop-mac.zip');
  });

  test('tagsMatch compares normalized tags', () => {
    expect(tagsMatch('v0.1.3', '0.1.3')).toBe(true);
    expect(tagsMatch('e453c2c', 'v0.1.3')).toBe(false);
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
});
