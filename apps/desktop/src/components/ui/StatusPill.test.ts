import { describe, expect, test } from 'bun:test';
import { READY_STATUS_LABELS, STATUS_CODE_LABELS } from './StatusPill';

describe('StatusPill status mapping (#058)', () => {
  test('STATUS_CODE_LABELS covers every StatusCode with user-facing copy', () => {
    const codes = ['ready', 'no-api-key', 'no-agent', 'unreachable', 'sdk-missing', 'stale', 'usage-limit', 'error'] as const;
    for (const code of codes) {
      expect(STATUS_CODE_LABELS[code]).toBeTruthy();
    }
    expect(STATUS_CODE_LABELS.ready).toBe('connected');
    expect(STATUS_CODE_LABELS['no-api-key']).toBe('auth needed');
    expect(STATUS_CODE_LABELS.error).toBe('not connected');
  });

  test('READY_STATUS_LABELS covers readiness panel states', () => {
    expect(READY_STATUS_LABELS.connected).toBe('connected');
    expect(READY_STATUS_LABELS.missing).toBe('missing');
    expect(READY_STATUS_LABELS['not-wired']).toBe('not wired');
  });
});
