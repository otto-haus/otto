import { describe, expect, it } from 'bun:test';
import { onboardingCopy } from '../src/copy/surfaces';
import { SAMPLE_RECEIPT_LABEL } from '../src/onboarding-sample-receipt';

const primaryOnboardingCopy = [
  onboardingCopy.welcomeBody,
  onboardingCopy.connectLede,
  onboardingCopy.runLede,
  onboardingCopy.receiptLede,
  onboardingCopy.modeEmbeddedBody,
  onboardingCopy.primaryStart,
  onboardingCopy.secondarySample,
  onboardingCopy.advancedExisting,
] as const;

describe('onboarding one-app copy (#97 / 080)', () => {
  it('keeps install Letta out of primary step text', () => {
    for (const line of primaryOnboardingCopy) {
      expect(line.toLowerCase()).not.toContain('install letta');
    }
  });

  it('describes one-app primary journey and auto-discover connect copy', () => {
    expect(onboardingCopy.welcomeBody.toLowerCase()).toContain('one desktop app');
    expect(onboardingCopy.connectLede.toLowerCase()).toContain('auto-discover');
  });

  it('labels advanced existing Letta path explicitly', () => {
    expect(onboardingCopy.advancedExisting).toBe('Advanced: existing Letta install');
    expect(onboardingCopy.modeExistingTitle.toLowerCase()).toContain('existing letta');
  });

  it('keeps sample receipt reference honest per 071', () => {
    expect(SAMPLE_RECEIPT_LABEL).toContain('sample');
    expect(SAMPLE_RECEIPT_LABEL.toLowerCase()).toContain('not live');
    expect(onboardingCopy.sampleOnlyNote.toLowerCase()).toContain('sample path');
  });
});
