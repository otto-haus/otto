import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'bun:test';
import { appendRawLog, initOttoFileLogger, ottoLogPath, writeLog } from './otto-file-logger';

describe('otto-file-logger', () => {
  let dir = '';

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = '';
  });

  test('writes redacted lines to service log files', () => {
    dir = mkdtempSync(join(tmpdir(), 'otto-file-logger-'));
    initOttoFileLogger(dir);
    writeLog('runtime', 'info', 'connected transport=ws bearer token=super-secret-token-value-1234567890');
    appendRawLog('letta-remote', 'stderr: Authorization: Bearer abcdefghijklmnopqrstuvwxyz\n');

    expect(existsSync(ottoLogPath('runtime'))).toBe(true);
    const runtimeText = readFileSync(ottoLogPath('runtime'), 'utf8');
    expect(runtimeText).toContain('connected transport=ws');
    expect(runtimeText).not.toContain('super-secret-token-value-1234567890');

    const remoteText = readFileSync(ottoLogPath('letta-remote'), 'utf8');
    expect(remoteText).toContain('stderr:');
    expect(remoteText).not.toContain('abcdefghijklmnopqrstuvwxyz');
  });
});
