import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  openReceipt,
  openStandard,
  readStoredReceiptSelection,
  readStoredStandardSelection,
  RECEIPTS_SELECTED_KEY,
  STANDARDS_SELECTED_KEY,
  stageReceiptSelection,
} from './surface-selection-nav';

describe('surface-selection-nav (#713)', () => {
  const priorStorage = globalThis.sessionStorage;
  const priorLocation = globalThis.location;

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    } as Storage;
    let hash = '';
    globalThis.location = { get hash() { return hash; }, set hash(v: string) { hash = v; } } as Location;
  });

  afterEach(() => {
    globalThis.sessionStorage = priorStorage;
    globalThis.location = priorLocation;
  });

  test('readStoredReceiptSelection consumes sessionStorage once', () => {
    stageReceiptSelection('rcpt-abc');
    expect(readStoredReceiptSelection()).toBe('rcpt-abc');
    expect(sessionStorage.getItem(RECEIPTS_SELECTED_KEY)).toBeNull();
  });

  test('openReceipt stages id and navigates via callback', () => {
    let surface: string | null = null;
    openReceipt('rcpt-1', (s) => { surface = s; });
    expect(surface).toBe('receipts');
    expect(readStoredReceiptSelection()).toBe('rcpt-1');
  });

  test('openStandard stages slug and sets hash', () => {
    openStandard('no-fake-done');
    expect(location.hash).toBe('standards');
    expect(readStoredStandardSelection()).toBe('no-fake-done');
    expect(sessionStorage.getItem(STANDARDS_SELECTED_KEY)).toBeNull();
  });
});
