import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateImage, resolveImageGenApiKey } from './image-gen';

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('image-gen', () => {
  test('resolveImageGenApiKey prefers explicit then env', () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'env-key';
    try {
      expect(resolveImageGenApiKey(' explicit ')).toBe('explicit');
      expect(resolveImageGenApiKey(null)).toBe('env-key');
    } finally {
      if (prev == null) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = prev;
    }
  });

  test('generateImage saves artifact + receipt without leaking key', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'otto-image-gen-'));
    try {
      process.env.OTTO_HOME = tmp;
      const result = await generateImage({
        prompt: 'otto owl',
        apiKey: 'test-openai-key-not-logged',
        fetchImpl: async () => new Response(JSON.stringify({
          data: [{ b64_json: PNG_B64 }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      });

      expect(result.artifact.provenance.ratified).toBe(false);
      expect(result.artifact.path.startsWith(join(tmp, 'artifacts'))).toBe(true);
      expect(readFileSync(result.receiptPath, 'utf8')).toContain('labs.image_gen.generate');
      expect(readFileSync(result.receiptPath, 'utf8')).not.toContain('test-openai-key-not-logged');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      delete process.env.OTTO_HOME;
    }
  });

  test('generateImage fails honestly when provider key missing', async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await expect(generateImage({ prompt: 'owl' })).rejects.toThrow(/provider key missing/i);
    } finally {
      if (prev == null) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = prev;
    }
  });
});
