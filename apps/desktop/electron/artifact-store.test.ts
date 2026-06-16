import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { artifactsDir, isGeneratedArtifactPath, saveGeneratedArtifact } from './artifact-store';

describe('artifact-store', () => {
  test('persists generated image under ~/.otto/artifacts with provenance metadata', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-artifact-'));
    try {
      process.env.OTTO_HOME = tmp;
      const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489', 'hex');
      const saved = saveGeneratedArtifact({
        imageBytes: png,
        mime: 'image/png',
        prompt: 'owl mascot sketch',
        model: 'gpt-image-1',
      });

      expect(saved.path.startsWith(join(tmp, 'artifacts'))).toBe(true);
      expect(saved.provenance.ratified).toBe(false);
      expect(saved.provenance.source).toBe('image_gen');
      expect(readFileSync(`${saved.path}.meta.json`, 'utf8')).toContain('owl mascot sketch');

      expect(isGeneratedArtifactPath(saved.path)).toBe(true);
      expect(isGeneratedArtifactPath(join(tmp, 'attachments/foo.png'))).toBe(false);
      expect(artifactsDir()).toBe(join(tmp, 'artifacts'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });
});
