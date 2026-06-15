import { describe, expect, test } from 'bun:test';
import {
  disableSampleReceiptPreview,
  enableSampleReceiptPreview,
  getSampleReceiptDetail,
  isSampleReceiptPreview,
  sampleReceiptCard,
  sampleReceiptSummary,
  SAMPLE_RECEIPT_LABEL,
} from './onboarding-sample-receipt';

function mockSessionStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const prior = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  } as Storage;
  return store;
}

describe('onboarding sample receipt (#89)', () => {
  test('label is exact agreed sample string', () => {
    expect(SAMPLE_RECEIPT_LABEL).toBe('sample · not live · not from your workspace');
  });

  test('session flag toggles sample preview', () => {
    const store = mockSessionStorage();
    const prior = globalThis.sessionStorage;
    try {
      expect(isSampleReceiptPreview()).toBe(false);
      enableSampleReceiptPreview();
      expect(isSampleReceiptPreview()).toBe(true);
      expect(store.get('otto.onboarding.sampleReceipt.v1')).toBe('1');
      disableSampleReceiptPreview();
      expect(isSampleReceiptPreview()).toBe(false);
    } finally {
      globalThis.sessionStorage = prior;
    }
  });

  test('fixture exposes inspectable otto.receipt.v1 structure', () => {
    const detail = getSampleReceiptDetail();
    expect(detail.schema).toBe('otto.receipt.v1');
    expect(detail.id).toBe(sampleReceiptSummary.id);
    expect(detail.evidence.length).toBeGreaterThan(0);
    expect(detail.input).toEqual({ note: SAMPLE_RECEIPT_LABEL });
    expect(sampleReceiptCard.metaLine).toContain(SAMPLE_RECEIPT_LABEL);
    expect(sampleReceiptSummary.summary).toContain('Sample proof record');
  });
});
