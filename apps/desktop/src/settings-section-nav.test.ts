import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  initialSettingsSection,
  normalizeSettingsSection,
  openSettingsSection,
  persistSettingsSection,
  readLastSettingsSection,
  readPendingSettingsSection,
  SETTINGS_SECTION_EVENT,
  SETTINGS_SECTION_KEY,
} from './settings-section-nav';

describe('settings-section-nav (#613)', () => {
  const priorStorage = globalThis.sessionStorage;
  const priorWindow = globalThis.window;
  const listeners = new Map<string, Set<EventListener>>();

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;
    globalThis.window = {
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((fn) => fn(event));
        return true;
      },
      addEventListener: (type: string, fn: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      },
      removeEventListener: (type: string, fn: EventListener) => {
        listeners.get(type)?.delete(fn);
      },
    } as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.sessionStorage = priorStorage;
    globalThis.window = priorWindow;
    listeners.clear();
  });

  test('normalizeSettingsSection maps legacy labs to diagnostics', () => {
    expect(normalizeSettingsSection('labs')).toBe('diagnostics');
    expect(normalizeSettingsSection('memory')).toBe('memory');
    expect(normalizeSettingsSection('bogus')).toBeNull();
  });

  test('readPendingSettingsSection consumes sessionStorage once', () => {
    sessionStorage.setItem(SETTINGS_SECTION_KEY, 'memory');
    expect(readPendingSettingsSection()).toBe('memory');
    expect(readPendingSettingsSection()).toBeNull();
  });

  test('openSettingsSection dispatches event for mounted Settings listener', () => {
    let seen = 0;
    const onEvent = () => {
      seen += 1;
      expect(readPendingSettingsSection()).toBe('diagnostics');
    };
    window.addEventListener(SETTINGS_SECTION_EVENT, onEvent);
    openSettingsSection('labs');
    expect(seen).toBe(1);
  });
});

describe('settings-section-nav (#615 persist)', () => {
  const priorStorage = globalThis.sessionStorage;

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;
  });

  afterEach(() => {
    globalThis.sessionStorage = priorStorage;
  });

  test('persistSettingsSection and readLastSettingsSection survive remount', () => {
    persistSettingsSection('memory');
    expect(readLastSettingsSection()).toBe('memory');
    expect(initialSettingsSection()).toBe('memory');
  });

  test('initialSettingsSection prefers pending deep-link over last', () => {
    persistSettingsSection('general');
    sessionStorage.setItem(SETTINGS_SECTION_KEY, 'culture');
    expect(initialSettingsSection()).toBe('culture');
  });
});
