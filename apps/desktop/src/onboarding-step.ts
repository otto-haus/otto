// Pure onboarding step machine — no React, no persisted chat message counts.

import type { OnboardingConnectionMode } from './onboarding-storage';

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

export type OnboardingModePickerInput = {
  started: boolean;
  intent: OnboardingIntent;
  connected: boolean;
  modeDraft: OnboardingConnectionMode | null;
};

/** Step 1a — connection mode cards before Settings chrome. */
export function shouldShowOnboardingModePicker(input: OnboardingModePickerInput): boolean {
  return input.started && input.intent === 'connect' && !input.connected && !input.modeDraft;
}

/** Continue stays disabled until a card is selected and persist is not in flight. */
export function canAdvanceOnboardingModePick(
  modePick: OnboardingConnectionMode | null,
  modeBusy: boolean,
): boolean {
  return modePick !== null && !modeBusy;
}
