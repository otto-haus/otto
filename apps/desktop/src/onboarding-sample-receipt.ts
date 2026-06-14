import type { ReceiptDetail, ReceiptSummary } from './runtime';

export const SAMPLE_RECEIPT_LABEL = 'sample · not live · not from your workspace';
const SAMPLE_FLAG = 'otto.onboarding.sampleReceipt.v1';

export function enableSampleReceiptPreview(): void {
  try { sessionStorage.setItem(SAMPLE_FLAG, '1'); } catch { /* ignore */ }
}

export function disableSampleReceiptPreview(): void {
  try { sessionStorage.removeItem(SAMPLE_FLAG); } catch { /* ignore */ }
}

export function isSampleReceiptPreview(): boolean {
  try { return sessionStorage.getItem(SAMPLE_FLAG) === '1'; } catch { return false; }
}

const SAMPLE_ID = 'receipt-sample-onboarding';

export const sampleReceiptSummary: ReceiptSummary = {
  id: SAMPLE_ID,
  timestamp: '2026-01-01T00:00:00.000Z',
  status: 'success' as const,
  action: 'onboarding.sample.turn',
  subjectType: 'task' as const,
  subjectId: 'onboarding-sample',
  summary: 'Sample proof record — structure only, not from your workspace.',
  blockerCode: null,
  evidenceCount: 1,
  practiceSlug: null,
  routineSlug: null,
  path: 'sample/onboarding-receipt.json',
};

export const sampleReceiptCard = {
  id: sampleReceiptSummary.id,
  action: sampleReceiptSummary.action,
  status: sampleReceiptSummary.status,
  summary: sampleReceiptSummary.summary,
  metaLine: `${SAMPLE_RECEIPT_LABEL} · ${sampleReceiptSummary.path}`,
};

export function getSampleReceiptDetail(): ReceiptDetail {
  return {
    schema: 'otto.receipt.v1',
    id: SAMPLE_ID,
    timestamp: sampleReceiptSummary.timestamp,
    status: 'success',
    subject: { type: 'task', id: 'onboarding-sample' },
    action: sampleReceiptSummary.action,
    input: { note: SAMPLE_RECEIPT_LABEL },
    result: {
      summary: sampleReceiptSummary.summary,
      data: { sample: true },
    },
    evidence: [
      {
        kind: 'message',
        ref: 'sample-thread/onboarding',
        note: 'Illustrative evidence row — not a live callback.',
      },
    ],
    blocker: null,
    path: sampleReceiptSummary.path,
  };
}
