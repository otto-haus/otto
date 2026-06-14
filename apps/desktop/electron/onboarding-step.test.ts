import { describe, expect, it } from 'bun:test';
import { onboardingDotIndex, resolveOnboardingStep } from '../src/onboarding-step';

describe('resolveOnboardingStep', () => {
  it('shows welcome before started', () => {
    expect(resolveOnboardingStep({
      started: false,
      intent: 'connect',
      connected: false,
      firstMessageDuringOnboarding: false,
    })).toBe('welcome');
  });

  it('ignores stale chat history — connect path waits for real connection', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'connect',
      connected: false,
      firstMessageDuringOnboarding: false,
    })).toBe('connect');
  });

  it('advances to run only when connected on connect path', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'connect',
      connected: true,
      firstMessageDuringOnboarding: false,
    })).toBe('run');
  });

  it('uses session first-message flag, not global message count', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'connect',
      connected: true,
      firstMessageDuringOnboarding: true,
    })).toBe('receipt');
  });

  it('receipts-preview intent skips connect and run docks', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'receipts-preview',
      connected: false,
      firstMessageDuringOnboarding: false,
    })).toBe('receipt');
  });
});

describe('onboardingDotIndex', () => {
  it('maps dock steps to 4-step journey indices', () => {
    expect(onboardingDotIndex('connect')).toBe(1);
    expect(onboardingDotIndex('run')).toBe(2);
    expect(onboardingDotIndex('receipt')).toBe(3);
  });
});
