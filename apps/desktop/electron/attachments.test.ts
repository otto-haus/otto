import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveAttachment } from './attachments';

const originalConfigDir = process.env.OTTO_CONFIG_DIR;
let tmp: string | null = null;

afterEach(() => {
  if (originalConfigDir === undefined) Reflect.deleteProperty(process.env, 'OTTO_CONFIG_DIR');
  else process.env.OTTO_CONFIG_DIR = originalConfigDir;
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('saveAttachment', () => {
  test('persists pasted image data under the local Otto attachments dir', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-attachments-'));
    const dir = tmp;
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

  test('rejects malformed base64 data instead of writing a corrupt attachment', () => {
    tmp = mkdtempSync(join(tmpdir(), 'otto-attachments-'));
    const dir = tmp;
    process.env.OTTO_CONFIG_DIR = dir;

    expect(() => saveAttachment({
      name: 'corrupt.png',
      mime: 'image/png',
      dataUrl: 'data:image/png;base64,not-base64',
    })).toThrow('valid base64');
  });
});
