// Onboarding persistence — scoped to first-run session, not global chat history.

export const ONBOARDED_KEY = 'otto.onboarded.v1';
export const FIRST_MESSAGE_KEY = 'otto.onboarding.firstMessage.v1';
export const MODE_DRAFT_KEY = 'otto.onboarding.connectionModeDraft.v1';

export type OnboardingConnectionMode = 'embedded' | 'existing';

export function getOnboardingModeDraft(): OnboardingConnectionMode | null {
  try {
    const v = sessionStorage.getItem(MODE_DRAFT_KEY);
    return v === 'embedded' || v === 'existing' ? v : null;
  } catch {
    return null;
  }
}

export function setOnboardingModeDraft(mode: OnboardingConnectionMode): void {
  try { sessionStorage.setItem(MODE_DRAFT_KEY, mode); } catch { /* ignore */ }
}

export function clearOnboardingModeDraft(): void {
  try { sessionStorage.removeItem(MODE_DRAFT_KEY); } catch { /* ignore */ }
}

export function requestOnboardingStarter(text: string): void {
  window.dispatchEvent(new CustomEvent('otto-onboarding-starter', { detail: { text, send: true } }));
}

export function wasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARDED_KEY) === '1'; } catch { return false; }
}

export function markOnboarded(): void {
  try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* ignore */ }
}

export function wasFirstMessageDuringOnboarding(): boolean {
  try { return localStorage.getItem(FIRST_MESSAGE_KEY) === '1'; } catch { return false; }
}

export function markFirstMessageDuringOnboarding(): void {
  try { localStorage.setItem(FIRST_MESSAGE_KEY, '1'); } catch { /* ignore */ }
}

/** Support/debug: replay onboarding. Also clears first-message flag so Done/Skip stays honest. */
export function resetOnboardingForReplay(): void {
  try {
    localStorage.removeItem(ONBOARDED_KEY);
    localStorage.removeItem(FIRST_MESSAGE_KEY);
  } catch { /* ignore */ }
}

type FirstMessageListener = () => void;
const firstMessageListeners = new Set<FirstMessageListener>();

type DismissListener = () => void;
const dismissListeners = new Set<DismissListener>();

export function onOnboardingFirstMessage(listener: FirstMessageListener): () => void {
  firstMessageListeners.add(listener);
  return () => firstMessageListeners.delete(listener);
}

export function onOnboardingDismiss(listener: DismissListener): () => void {
  dismissListeners.add(listener);
  return () => dismissListeners.delete(listener);
}

/** First successful chat send during active onboarding — advance receipt hint and dismiss dock permanently. */
export function notifyOnboardingFirstMessage(): void {
  if (wasOnboarded() || wasFirstMessageDuringOnboarding()) return;
  markFirstMessageDuringOnboarding();
  markOnboarded();
  firstMessageListeners.forEach((listener) => listener());
  dismissListeners.forEach((listener) => listener());
}

/** Skip / Done — dismiss onboarding without sending a message. */
export function dismissOnboarding(): void {
  markOnboarded();
  dismissListeners.forEach((listener) => listener());
}
