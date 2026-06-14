import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSecret, hasSecret, secretsFilePath, setSecret } from './secret-store';

describe('secret-store', () => {
  const previousHome = process.env.OTTO_HOME;
  const previousConfigDir = process.env.OTTO_CONFIG_DIR;

  afterEach(() => {
    if (previousHome === undefined) delete process.env.OTTO_HOME;
    else process.env.OTTO_HOME = previousHome;
    if (previousConfigDir === undefined) delete process.env.OTTO_CONFIG_DIR;
    else process.env.OTTO_CONFIG_DIR = previousConfigDir;
  });

  test('stores secrets under OTTO_HOME with owner-only permissions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-secrets-test-'));
    try {
      process.env.OTTO_HOME = dir;
      delete process.env.OTTO_CONFIG_DIR;

      setSecret('LETTA_API_KEY', 'test-key-material');

      const file = join(dir, 'secrets.env');
      expect(secretsFilePath()).toBe(file);
      expect(existsSync(file)).toBe(true);
      expect(getSecret('LETTA_API_KEY')).toBe('test-key-material');
      expect(hasSecret('LETTA_API_KEY')).toBe(true);
      expect(statSync(file).mode & 0o777).toBe(0o600);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('clearing a secret removes it from the isolated store', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-secrets-test-'));
    try {
      process.env.OTTO_HOME = dir;
      delete process.env.OTTO_CONFIG_DIR;

      setSecret('LETTA_API_KEY', 'test-key-material');
      setSecret('LETTA_API_KEY', null);

      expect(getSecret('LETTA_API_KEY')).toBeNull();
      expect(hasSecret('LETTA_API_KEY')).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
