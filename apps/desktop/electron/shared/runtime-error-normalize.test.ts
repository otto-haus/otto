import { describe, expect, test } from 'bun:test';
import { friendlyMessage, normalizeRuntimeError, runtimeStatusFromInitError } from './runtime-error-normalize';

describe('runtime-error-normalize (#586)', () => {
  test('normalizeRuntimeError maps ECONNREFUSED to friendly unreachable copy', () => {
    const normalized = normalizeRuntimeError('ECONNREFUSED 127.0.0.1:8283', false);
    expect(normalized.code).toBe('unreachable');
    expect(normalized.message).toMatch(/Can't reach the Letta backend/i);
    expect(normalized.message).not.toContain('ECONNREFUSED');
    expect(normalized.details).toBe('ECONNREFUSED 127.0.0.1:8283');
  });

  test('runtimeStatusFromInitError never surfaces raw exception string as reason', () => {
    const status = runtimeStatusFromInitError(new Error('ECONNREFUSED 127.0.0.1:8283'));
    expect(status.ready).toBe(false);
    expect(status.code).toBe('unreachable');
    expect(status.reason).toMatch(/Can't reach the Letta backend/i);
    expect(status.reason).not.toContain('ECONNREFUSED');
  });

  test('friendlyMessage hides long JSON payloads', () => {
    const raw = `{${'x'.repeat(200)}}`;
    expect(friendlyMessage('error', raw)).toMatch(/Runtime error — open diagnostics/i);
  });
});
