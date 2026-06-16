import { describe, expect, test } from 'bun:test';
import type { ReceiptDetail } from '../runtime';
import {
  findArtifactRef,
  previewContentFromReceiptDetail,
  receiptDetailToMarkdown,
  receiptPreviewEligible,
} from './receipt-preview';

const fixtureReceipt: ReceiptDetail = {
  schema: 'otto.receipt.v1',
  id: 'receipt-fixture-preview',
  timestamp: '2026-06-16T10:00:00.000Z',
  status: 'success',
  subject: { type: 'chat', id: 'thread-a' },
  action: 'chat.send',
  input: { text: 'hello preview' },
  result: {
    summary: 'Turn completed with HTML artifact.',
    data: { conversationId: 'thread-a' },
  },
  evidence: [
    { kind: 'file', ref: '/tmp/proof/turn-summary.md', note: 'Markdown export' },
  ],
  blocker: null,
  path: '/tmp/receipts/receipt-fixture-preview.json',
};

describe('receipt-preview (#660)', () => {
  test('findArtifactRef prefers markdown/html evidence files', () => {
    expect(findArtifactRef(fixtureReceipt)).toBe('/tmp/proof/turn-summary.md');
  });

  test('receiptDetailToMarkdown renders structured proof export', () => {
    const md = receiptDetailToMarkdown(fixtureReceipt);
    expect(md).toContain('# Receipt `receipt-fixture-preview`');
    expect(md).toContain('Turn completed with HTML artifact.');
    expect(md).toContain('/tmp/proof/turn-summary.md');
  });

  test('previewContentFromReceiptDetail uses artifact body when provided', () => {
    const content = previewContentFromReceiptDetail(fixtureReceipt, {
      ref: '/tmp/proof/turn-summary.md',
      body: '# Proof\n\n```html\n<h1>Done</h1>\n```',
    });
    expect(content?.kind).toBe('html');
    expect(content?.title).toContain('receipt-fixture-preview');
  });

  test('receiptPreviewEligible is false without detail', () => {
    expect(receiptPreviewEligible(null).eligible).toBe(false);
  });

  test('receiptPreviewEligible is true for fixture receipt', () => {
    expect(receiptPreviewEligible(fixtureReceipt).eligible).toBe(true);
  });
});
