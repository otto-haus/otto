import { describe, expect, test } from 'bun:test';
import { shouldUseConnectSettingsOverlay } from '../src/onboarding-step';

describe('shouldUseConnectSettingsOverlay (#590 #591)', () => {
  test('connect step on Settings uses overlay instead of sticky dock', () => {
    expect(shouldUseConnectSettingsOverlay('connect', 'settings')).toBe(true);
  });

  test('connect step on other surfaces keeps sticky dock', () => {
    expect(shouldUseConnectSettingsOverlay('connect', 'chat')).toBe(false);
    expect(shouldUseConnectSettingsOverlay('connect', 'receipts')).toBe(false);
  });

  test('non-connect steps never use connect overlay', () => {
    expect(shouldUseConnectSettingsOverlay('run', 'settings')).toBe(false);
    expect(shouldUseConnectSettingsOverlay('receipt', 'settings')).toBe(false);
    expect(shouldUseConnectSettingsOverlay('welcome', 'settings')).toBe(false);
  });
});
