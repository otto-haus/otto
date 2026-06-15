import { describe, expect, it } from 'bun:test';
import { resolveOnboardingStep } from '../src/onboarding-step';
import { wasOnboarded, wasFirstMessageDuringOnboarding } from '../src/onboarding-storage';

describe('onboarding connected-first policy (#320)', () => {
  it('shows welcome on fresh connected profile without auto-onboarded flag', () => {
    expect(resolveOnboardingStep({
      started: false,
      intent: 'connect',
      connected: true,
      firstMessageDuringOnboarding: false,
    })).toBe('welcome');
    expect(wasOnboarded()).toBe(false);
    expect(wasFirstMessageDuringOnboarding()).toBe(false);
  });

  it('connected start path skips connect theater and lands on run', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'connect',
      connected: true,
      firstMessageDuringOnboarding: false,
    })).toBe('run');
  });
});
