// Pure onboarding step machine — no React, no persisted chat message counts.

export type OnboardingIntent = 'connect' | 'receipts-preview';
export type OnboardingStep = 'welcome' | 'connect' | 'run' | 'receipt';

export type OnboardingStepInput = {
  started: boolean;
  intent: OnboardingIntent;
  connected: boolean;
  /** Set during this onboarding session only — never from stale chat localStorage. */
  firstMessageDuringOnboarding: boolean;
};

export function resolveOnboardingStep(input: OnboardingStepInput): OnboardingStep {
  if (!input.started) return 'welcome';
  if (input.intent === 'receipts-preview') return 'receipt';
  if (!input.connected) return 'connect';
  if (!input.firstMessageDuringOnboarding) return 'run';
  return 'receipt';
}

/** Dot index for the 4-step journey (welcome = 0, connect = 1, run = 2, receipt = 3). */
export function onboardingDotIndex(step: Exclude<OnboardingStep, 'welcome'>): number {
  switch (step) {
    case 'connect': return 1;
    case 'run': return 2;
    case 'receipt': return 3;
  }
}

export const ONBOARDING_STEP_COUNT = 4;
