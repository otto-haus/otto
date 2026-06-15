import { describe, expect, it } from 'bun:test';
import {
  canAdvanceOnboardingModePick,
  shouldShowOnboardingModePicker,
} from '../src/onboarding-step';

describe('onboarding connection mode picker (#136)', () => {
  it('shows mode cards on connect path before Settings when no draft exists', () => {
    expect(shouldShowOnboardingModePicker({
      started: true,
      intent: 'connect',
      connected: false,
      modeDraft: null,
    })).toBe(true);
  });

  it('hides mode cards before start, when connected, or after draft is saved', () => {
    expect(shouldShowOnboardingModePicker({
      started: false,
      intent: 'connect',
      connected: false,
      modeDraft: null,
    })).toBe(false);

    expect(shouldShowOnboardingModePicker({
      started: true,
      intent: 'connect',
      connected: true,
      modeDraft: null,
    })).toBe(false);

    expect(shouldShowOnboardingModePicker({
      started: true,
      intent: 'connect',
      connected: false,
      modeDraft: 'embedded',
    })).toBe(false);

    expect(shouldShowOnboardingModePicker({
      started: true,
      intent: 'receipts-preview',
      connected: false,
      modeDraft: null,
    })).toBe(false);
  });

  it('disables Continue until a card is selected and persist is idle', () => {
    expect(canAdvanceOnboardingModePick(null, false)).toBe(false);
    expect(canAdvanceOnboardingModePick('embedded', true)).toBe(false);
    expect(canAdvanceOnboardingModePick('existing', false)).toBe(true);
  });
});
