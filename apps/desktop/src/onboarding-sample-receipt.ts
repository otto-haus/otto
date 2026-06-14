import type { ReceiptDetail, ReceiptSummary } from './runtime';

export const SAMPLE_RECEIPT_LABEL = 'sample · not live · not from your workspace';

export const SAMPLE_RECEIPT_SUMMARY: ReceiptSummary = {
  id: 'sample-onboarding-receipt',
  timestamp: '2026-06-13T12:00:00.000Z',
  status: 'success',
  action: 'chat.send',
  subjectType: 'chat',
  subjectId: 'onboarding-sample',
  summary: 'Example proof record — what otto retained after a behavior loop.',
  blockerCode: null,
  evidenceCount: 2,
  practiceSlug: null,
  routineSlug: null,
  path: SAMPLE_RECEIPT_LABEL,
};

export const SAMPLE_RECEIPT_DETAIL: ReceiptDetail = {
  schema: 'otto.receipt.v1',
  id: 'sample-onboarding-receipt',
  timestamp: '2026-06-13T12:00:00.000Z',
  status: 'success',
  subject: { type: 'chat', id: 'onboarding-sample' },
  action: 'chat.send',
  input: {
    text: 'Summarize what we decided about wire-fraud tripwires.',
    conversationId: 'onboarding-sample',
  },
  result: {
    summary: 'Chat turn completed with cited Standards and file evidence.',
    data: { conversationId: 'onboarding-sample', messageCount: 1 },
  },
  evidence: [
    {
      kind: 'file',
      ref: 'docs/onepagers/receipts.md',
      note: 'Canon brief cited at write time.',
      proves: ['proof-structure'],
    },
    {
      kind: 'message',
      ref: 'chat:turn-1',
      note: 'Operator prompt retained in the receipt input block.',
    },
  ],
  standards: [
    {
      slug: 'prove-then-proceed',
      name: 'Prove then proceed',
      ref: 'standards/prove-then-proceed.md',
      reason: 'Receipt records what was relied on before the next run.',
      evidence: ['AC1'],
    },
  ],
  practice: null,
  routine: null,
  blocker: null,
  path: SAMPLE_RECEIPT_LABEL,
};

let samplePreviewEnabled = false;

export function enableSampleReceiptPreview(): void {
  samplePreviewEnabled = true;
}

export function isSampleReceiptPreviewEnabled(): boolean {
  return samplePreviewEnabled;
}
