import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  requestOnboardingStarter,
  resolveOnboardingStarterAction,
} from '../src/onboarding-storage';

describe('onboarding starter chips (#138)', () => {
  const listeners = new Map<string, Set<EventListener>>();

  beforeEach(() => {
    listeners.clear();
    globalThis.window = {
      addEventListener(type: string, listener: EventListener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener(type: string, listener: EventListener) {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent(event: Event) {
        listeners.get(event.type)?.forEach((listener) => listener(event));
        return true;
      },
    } as Window;
  });

  afterEach(() => {
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  it('requestOnboardingStarter dispatches live-send event detail', () => {
    let captured: CustomEvent<{ text?: string; send?: boolean }> | null = null;
    const handler = (event: Event) => { captured = event as CustomEvent; };
    window.addEventListener('otto-onboarding-starter', handler);
    try {
      requestOnboardingStarter('Summarize what otto can do');
      expect(captured?.type).toBe('otto-onboarding-starter');
      expect(captured?.detail).toEqual({ text: 'Summarize what otto can do', send: true });
    } finally {
      window.removeEventListener('otto-onboarding-starter', handler);
    }
  });

  it('resolveOnboardingStarterAction queues when ready and send=true', () => {
    expect(resolveOnboardingStarterAction(
      { text: '  Run a reversible check  ', send: true },
      { ready: true, hasApi: true },
    )).toEqual({ kind: 'queue', text: 'Run a reversible check' });
  });

  it('resolveOnboardingStarterAction ignores when not ready or no adapter', () => {
    expect(resolveOnboardingStarterAction(
      { text: 'hello', send: true },
      { ready: false, hasApi: true },
    )).toEqual({ kind: 'ignore' });
    expect(resolveOnboardingStarterAction(
      { text: 'hello', send: true },
      { ready: true, hasApi: false },
    )).toEqual({ kind: 'ignore' });
  });

  it('resolveOnboardingStarterAction fills draft when send=false', () => {
    expect(resolveOnboardingStarterAction(
      { text: 'draft me', send: false },
      { ready: true, hasApi: true },
    )).toEqual({ kind: 'draft', text: 'draft me' });
  });
});
