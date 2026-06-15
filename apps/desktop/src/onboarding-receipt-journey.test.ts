import { describe, expect, test } from 'bun:test';
import { onboardingCopy, receiptsCopy } from './copy/surfaces';
import { ONBOARDING_STEP_COUNT, onboardingDotIndex, resolveOnboardingStep } from './onboarding-step';
import { SAMPLE_RECEIPT_LABEL } from './onboarding-sample-receipt';

const ONBOARDING_RECEIPT_STRINGS = [
  onboardingCopy.secondarySample,
  onboardingCopy.progressReceipt,
  onboardingCopy.receiptTitle,
  onboardingCopy.receiptLede,
  onboardingCopy.receiptOpen,
  onboardingCopy.runLede,
  onboardingCopy.sampleOnlyNote,
  receiptsCopy.sampleLede,
] as const;

describe('onboarding receipt journey (#89)', () => {
  test('four-step journey includes receipt payoff', () => {
    expect(ONBOARDING_STEP_COUNT).toBe(4);
    expect(onboardingCopy.progressReceipt).toBe('Receipt');
    expect(onboardingDotIndex('receipt')).toBe(3);
  });

  test('receipts-preview intent lands on receipt step without connect/run', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'receipts-preview',
      connected: false,
      firstMessageDuringOnboarding: false,
    })).toBe('receipt');
  });

  test('connect path advances to receipt after first session message', () => {
    expect(resolveOnboardingStep({
      started: true,
      intent: 'connect',
      connected: true,
      firstMessageDuringOnboarding: true,
    })).toBe('receipt');
  });

  test('onboarding receipt copy never claims receipts are coming soon', () => {
    const forbidden = ['coming soon', 'receipts land', 'once receipts land'];
    for (const line of ONBOARDING_RECEIPT_STRINGS) {
      const lower = line.toLowerCase();
      for (const phrase of forbidden) {
        expect(lower).not.toContain(phrase);
      }
    }
  });

  test('run step points at real receipt inspection path', () => {
    expect(onboardingCopy.runLede.toLowerCase()).toContain('receipt');
    expect(onboardingCopy.secondarySample.toLowerCase()).toContain('receipt');
    expect(receiptsCopy.sampleLede.toLowerCase()).toContain('sample');
    expect(SAMPLE_RECEIPT_LABEL).toContain('not live');
  });
});
