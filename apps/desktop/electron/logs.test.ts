import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { latestOttoLogTarget } from './logs';

const originalLogDir = process.env.OTTO_LOG_DIR;

afterEach(() => {
  if (originalLogDir === undefined) delete process.env.OTTO_LOG_DIR;
  else process.env.OTTO_LOG_DIR = originalLogDir;
});

describe('latestOttoLogTarget', () => {
  test('chooses the newest desktop log candidate', () => {
    const dir = mkdtempSync(join(tmpdir(), 'otto-logs-test-'));
    try {
      process.env.OTTO_LOG_DIR = dir;
      const refresh = join(dir, 'refresh-latest.app.log');
      const staging = join(dir, 'staging-latest.app.log');
      writeFileSync(refresh, 'old refresh');
      writeFileSync(staging, 'new staging');
      const oldTime = new Date('2026-06-14T10:00:00.000Z');
      const newTime = new Date('2026-06-14T11:00:00.000Z');
      utimesSync(refresh, oldTime, oldTime);
      utimesSync(staging, newTime, newTime);

      expect(latestOttoLogTarget()).toBe(staging);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
