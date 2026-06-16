import { describe, expect, test } from 'bun:test';
import {
  shouldUseConnectSettingsOverlay,
  shouldUseOnboardingSettingsOverlay,
  shouldUseRunSettingsOverlay,
} from '../src/onboarding-step';

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

describe('shouldUseRunSettingsOverlay (#580)', () => {
  test('run step on Settings uses overlay instead of hiding guidance', () => {
    expect(shouldUseRunSettingsOverlay('run', 'settings')).toBe(true);
  });

  test('run step on Chat keeps sticky dock', () => {
    expect(shouldUseRunSettingsOverlay('run', 'chat')).toBe(false);
  });

  test('non-run steps never use run overlay', () => {
    expect(shouldUseRunSettingsOverlay('connect', 'settings')).toBe(false);
    expect(shouldUseRunSettingsOverlay('receipt', 'settings')).toBe(false);
  });
});

describe('shouldUseOnboardingSettingsOverlay', () => {
  test('connect or run on Settings uses step overlay', () => {
    expect(shouldUseOnboardingSettingsOverlay('connect', 'settings')).toBe(true);
    expect(shouldUseOnboardingSettingsOverlay('run', 'settings')).toBe(true);
  });

  test('receipt on Settings keeps dock anchor', () => {
    expect(shouldUseOnboardingSettingsOverlay('receipt', 'settings')).toBe(false);
  });
});
