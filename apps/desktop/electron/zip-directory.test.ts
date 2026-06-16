import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import { zipDirectory } from './zip-directory';

describe('zipDirectory', () => {
  let root = '';

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  test('writes a zip archive readable without system zip CLI', async () => {
    root = mkdtempSync(join(tmpdir(), 'otto-zip-dir-'));
    const sourceDir = join(root, 'bundle');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(sourceDir, 'manifest.json'), '{"ok":true}\n');
    const zipPath = join(root, 'bundle.zip');

    await zipDirectory(sourceDir, zipPath);

    expect(existsSync(zipPath)).toBe(true);
    expect(readFileSync(zipPath, 'utf8').slice(0, 2)).toBe('PK');
  });
});
