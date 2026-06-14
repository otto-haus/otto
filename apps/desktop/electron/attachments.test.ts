import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveAttachment } from './attachments';

const originalConfigDir = process.env.OTTO_CONFIG_DIR;

afterEach(() => {
  if (originalConfigDir === undefined) Reflect.deleteProperty(process.env, 'OTTO_CONFIG_DIR');
  else process.env.OTTO_CONFIG_DIR = originalConfigDir;
});

describe('saveAttachment', () => {
  test('persists pasted image data under the local Otto attachments dir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-attachments-'));
    process.env.OTTO_CONFIG_DIR = dir;

    const saved = saveAttachment({
      name: 'pasted screenshot.png',
      mime: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    });

    expect(saved.name).toBe('pasted-screenshot.png');
    expect(saved.mime).toBe('image/png');
    expect(saved.path.startsWith(join(dir, 'attachments'))).toBe(true);
    expect(saved.url.startsWith('file://')).toBe(true);
    expect(existsSync(saved.path)).toBe(true);
  });
});
