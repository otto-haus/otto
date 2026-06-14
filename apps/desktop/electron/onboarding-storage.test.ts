import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  FIRST_MESSAGE_KEY,
  ONBOARDED_KEY,
  dismissOnboarding,
  notifyOnboardingFirstMessage,
  resetOnboardingForReplay,
  wasFirstMessageDuringOnboarding,
  wasOnboarded,
} from '../src/onboarding-storage';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  } as Storage;
});

afterEach(() => {
  resetOnboardingForReplay();
});

describe('onboarding storage', () => {
  it('notifyOnboardingFirstMessage marks first message and permanently dismisses dock', () => {
    notifyOnboardingFirstMessage();
    expect(wasFirstMessageDuringOnboarding()).toBe(true);
    expect(wasOnboarded()).toBe(true);
    notifyOnboardingFirstMessage();
    expect(localStorage.getItem(FIRST_MESSAGE_KEY)).toBe('1');
    expect(localStorage.getItem(ONBOARDED_KEY)).toBe('1');
  });

  it('dismissOnboarding marks onboarded', () => {
    dismissOnboarding();
    expect(wasOnboarded()).toBe(true);
    expect(localStorage.getItem(ONBOARDED_KEY)).toBe('1');
  });
});
