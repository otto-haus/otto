import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  FIRST_MESSAGE_KEY,
  MODE_DRAFT_KEY,
  ONBOARDED_KEY,
  clearOnboardingModeDraft,
  dismissOnboarding,
  getOnboardingModeDraft,
  notifyOnboardingFirstMessage,
  resetOnboardingForReplay,
  setOnboardingModeDraft,
  wasFirstMessageDuringOnboarding,
  wasFirstMessageDuringOnboarding,
  wasOnboarded,
} from '../src/onboarding-storage';

const store = new Map<string, string>();
const session = new Map<string, string>();

beforeEach(() => {
  store.clear();
  session.clear();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  } as Storage;
  globalThis.sessionStorage = {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => { session.set(key, value); },
    removeItem: (key: string) => { session.delete(key); },
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

  it('resetOnboardingForReplay clears onboarded and first-message flags', () => {
    notifyOnboardingFirstMessage();
    expect(wasOnboarded()).toBe(true);
    expect(wasFirstMessageDuringOnboarding()).toBe(true);
    resetOnboardingForReplay();
    expect(wasOnboarded()).toBe(false);
    expect(wasFirstMessageDuringOnboarding()).toBe(false);
  });

  it('persists connection mode draft for onboarding advance (#136)', () => {
    expect(getOnboardingModeDraft()).toBeNull();
    setOnboardingModeDraft('embedded');
    expect(getOnboardingModeDraft()).toBe('embedded');
    expect(sessionStorage.getItem(MODE_DRAFT_KEY)).toBe('embedded');
    setOnboardingModeDraft('existing');
    expect(getOnboardingModeDraft()).toBe('existing');
    clearOnboardingModeDraft();
    expect(getOnboardingModeDraft()).toBeNull();
    expect(sessionStorage.getItem(MODE_DRAFT_KEY)).toBeNull();
  });
});
